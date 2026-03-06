import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type DragEvent, type SetStateAction } from 'react'
import { decodeImportTextBytes, INVALID_TEXT_ENCODING_ERROR } from '../../../shared/textDecoding'
import type { TranslationDictionary } from '../../../i18n/types'
import {
  PORTRAIT_ADJUST_DEFAULT,
  enforceFileNameSideOrder,
  normalizePortraitAdjust,
  readFileAsDataUrl,
} from '../helpers'
import { parseVsImportText } from '../importer'
import { createManualFightRecord, insertManualFightRecord } from '../domain/fightFactory'
import type {
  FightRecord,
  ImportDropTarget,
  Language,
  ParsedVsImport,
  PortraitAdjust,
  PortraitEditorState,
} from '../types'

type UseVsDraftImportOptions = {
  language: Language
  translations: TranslationDictionary
  tr: (pl: string, en: string) => string
  fights: FightRecord[]
  activeFightId: string | null
  setFights: Dispatch<SetStateAction<FightRecord[]>>
  setPortraitAAdjust: Dispatch<SetStateAction<PortraitAdjust>>
  setPortraitBAdjust: Dispatch<SetStateAction<PortraitAdjust>>
  flashStatus?: (text: string) => void
}

export function useVsDraftImport({
  language,
  translations,
  tr,
  fights,
  activeFightId,
  setFights,
  setPortraitAAdjust,
  setPortraitBAdjust,
  flashStatus = () => {},
}: UseVsDraftImportOptions) {
  const ui = translations.ui

  const [draftPayload, setDraftPayload] = useState<ParsedVsImport | null>(null)
  const [draftTxtFileName, setDraftTxtFileName] = useState('')
  const [draftPortraitFileA, setDraftPortraitFileA] = useState<File | null>(null)
  const [draftPortraitFileB, setDraftPortraitFileB] = useState<File | null>(null)
  const [draftPortraitPreviewA, setDraftPortraitPreviewA] = useState('')
  const [draftPortraitPreviewB, setDraftPortraitPreviewB] = useState('')
  const [draftPortraitAdjustA, setDraftPortraitAdjustA] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [draftPortraitAdjustB, setDraftPortraitAdjustB] = useState<PortraitAdjust>({ ...PORTRAIT_ADJUST_DEFAULT })
  const [portraitEditor, setPortraitEditor] = useState<PortraitEditorState | null>(null)
  const [activeDropTarget, setActiveDropTarget] = useState<ImportDropTarget | null>(null)

  const draftTxtInputRef = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefA = useRef<HTMLInputElement>(null)
  const draftPortraitInputRefB = useRef<HTMLInputElement>(null)
  const draftPortraitPreviewRef = useRef<{ a: string | null; b: string | null }>({ a: null, b: null })
  const portraitEditorPreviewRef = useRef<string | null>(null)

  const localizeImportError = (error: string) => {
    if (language === 'en') return error
    const missingSection = error.match(/missing section\s+(\d+)/i)
    if (missingSection?.[1]) {
      return translations.errors.importMissingSection.replace('{section}', missingSection[1])
    }
    if (/need stat lines/i.test(error)) {
      return translations.errors.importNeedStatLines
    }
    return error
  }

  const closePortraitEditor = (options?: { revokePreview?: boolean }) => {
    const revokePreview = options?.revokePreview ?? true
    setPortraitEditor((current) => {
      if (current?.previewUrl && revokePreview && current.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return null
    })
  }

  const commitDraftPortrait = (side: 'a' | 'b', file: File, previewUrl: string, adjust: PortraitAdjust) => {
    const previous = draftPortraitPreviewRef.current[side]
    if (previous && previous !== previewUrl) URL.revokeObjectURL(previous)
    draftPortraitPreviewRef.current[side] = previewUrl

    const normalizedAdjust = normalizePortraitAdjust(adjust)
    if (side === 'a') {
      setDraftPortraitFileA(file)
      setDraftPortraitPreviewA(previewUrl)
      setDraftPortraitAdjustA(normalizedAdjust)
      return
    }

    setDraftPortraitFileB(file)
    setDraftPortraitPreviewB(previewUrl)
    setDraftPortraitAdjustB(normalizedAdjust)
  }

  const openDraftPortraitEditor = (side: 'a' | 'b', file: File) => {
    const previewUrl = URL.createObjectURL(file)
    const baseAdjust = side === 'a' ? draftPortraitAdjustA : draftPortraitAdjustB

    setPortraitEditor((current) => {
      if (current?.previewUrl && current.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return {
        mode: 'draft',
        side,
        file,
        previewUrl,
        adjust: normalizePortraitAdjust(baseAdjust),
      }
    })
  }

  const openSavedFightPortraitEditor = (fightId: string, side: 'a' | 'b') => {
    const match = fights.find((fight) => fight.id === fightId)
    if (!match) return
    const previewUrl = side === 'a' ? match.portraitADataUrl : match.portraitBDataUrl
    if (!previewUrl) return
    const baseAdjust = side === 'a' ? match.portraitAAdjust : match.portraitBAdjust

    setPortraitEditor((current) => {
      if (current?.previewUrl && current.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(current.previewUrl)
      }
      return {
        mode: 'fight',
        fightId: match.id,
        side,
        previewUrl,
        adjust: normalizePortraitAdjust(baseAdjust),
      }
    })
  }

  const applyPortraitEditor = () => {
    if (!portraitEditor) return

    if (portraitEditor.mode === 'draft') {
      commitDraftPortrait(
        portraitEditor.side,
        portraitEditor.file,
        portraitEditor.previewUrl,
        portraitEditor.adjust,
      )
      closePortraitEditor({ revokePreview: false })
      return
    }

    const nextAdjust = normalizePortraitAdjust(portraitEditor.adjust)
    setFights((current) =>
      current.map((fight) => {
        if (fight.id !== portraitEditor.fightId) return fight
        if (portraitEditor.side === 'a') {
          return {
            ...fight,
            portraitAAdjust: nextAdjust,
          }
        }
        return {
          ...fight,
          portraitBAdjust: nextAdjust,
        }
      }),
    )

    if (activeFightId === portraitEditor.fightId) {
      if (portraitEditor.side === 'a') setPortraitAAdjust(nextAdjust)
      if (portraitEditor.side === 'b') setPortraitBAdjust(nextAdjust)
    }

    closePortraitEditor({ revokePreview: false })
  }

  const updatePortraitEditorAdjust = (patch: Partial<PortraitAdjust>) => {
    setPortraitEditor((current) => {
      if (!current) return current
      return {
        ...current,
        adjust: normalizePortraitAdjust({
          ...current.adjust,
          ...patch,
        }),
      }
    })
  }

  const resetPortraitEditorAdjust = () => {
    updatePortraitEditorAdjust(PORTRAIT_ADJUST_DEFAULT)
  }

  const togglePortraitEditorSide = () => {
    setPortraitEditor((current) => {
      if (!current) return current
      const nextSide = current.side === 'a' ? 'b' : 'a'

      if (current.mode === 'draft') {
        const nextFile = nextSide === 'a' ? draftPortraitFileA : draftPortraitFileB
        if (!nextFile) return current
        const nextPreviewUrl = URL.createObjectURL(nextFile)
        if (current.previewUrl.startsWith('blob:') && current.previewUrl !== nextPreviewUrl) {
          URL.revokeObjectURL(current.previewUrl)
        }
        const nextAdjust = nextSide === 'a' ? draftPortraitAdjustA : draftPortraitAdjustB
        return {
          mode: 'draft',
          side: nextSide,
          file: nextFile,
          previewUrl: nextPreviewUrl,
          adjust: normalizePortraitAdjust(nextAdjust),
        }
      }

      const match = fights.find((fight) => fight.id === current.fightId)
      if (!match) return current
      const nextPreviewUrl = nextSide === 'a' ? match.portraitADataUrl : match.portraitBDataUrl
      if (!nextPreviewUrl) return current
      const nextAdjust = nextSide === 'a' ? match.portraitAAdjust : match.portraitBAdjust
      return {
        ...current,
        side: nextSide,
        previewUrl: nextPreviewUrl,
        adjust: normalizePortraitAdjust(nextAdjust),
      }
    })
  }

  const clearDraftPortraits = () => {
    closePortraitEditor()
    const oldA = draftPortraitPreviewRef.current.a
    const oldB = draftPortraitPreviewRef.current.b
    if (oldA) URL.revokeObjectURL(oldA)
    if (oldB) URL.revokeObjectURL(oldB)
    draftPortraitPreviewRef.current = { a: null, b: null }
    setDraftPortraitFileA(null)
    setDraftPortraitFileB(null)
    setDraftPortraitPreviewA('')
    setDraftPortraitPreviewB('')
    setDraftPortraitAdjustA({ ...PORTRAIT_ADJUST_DEFAULT })
    setDraftPortraitAdjustB({ ...PORTRAIT_ADJUST_DEFAULT })
  }

  const isImportTxtFile = (file: File) => {
    const name = file.name.toLowerCase()
    return name.endsWith('.txt') || file.type === 'text/plain'
  }

  const isImportImageFile = (file: File) => {
    const name = file.name.toLowerCase()
    return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(name)
  }

  const parseDraftImportFromFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const raw = decodeImportTextBytes(new Uint8Array(buffer))
      const parsed = parseVsImportText(raw)
      if (!parsed.ok) {
        flashStatus(localizeImportError(parsed.error))
        return
      }

      const payload = enforceFileNameSideOrder(parsed.data, file.name)
      setDraftPayload(payload)
      setDraftTxtFileName(file.name)
    } catch (error) {
      if (error instanceof Error && error.message === INVALID_TEXT_ENCODING_ERROR) {
        flashStatus(translations.encoding.invalidEncoding)
        return
      }
      flashStatus(ui.importFailed)
    }
  }

  const handleDropZoneDragEnter =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setActiveDropTarget(target)
    }

  const handleDropZoneDragOver =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      if (activeDropTarget !== target) {
        setActiveDropTarget(target)
      }
    }

  const handleDropZoneDragLeave =
    (target: ImportDropTarget) => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const nextTarget = event.relatedTarget as Node | null
      if (nextTarget && event.currentTarget.contains(nextTarget)) return
      setActiveDropTarget((current) => (current === target ? null : current))
    }

  const handleTxtDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setActiveDropTarget((current) => (current === 'txt' ? null : current))
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      return
    }
    void parseDraftImportFromFile(file)
  }

  const handlePortraitDrop =
    (side: 'a' | 'b') => (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const target = side === 'a' ? 'a' : 'b'
      setActiveDropTarget((current) => (current === target ? null : current))
      const file = event.dataTransfer.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        return
      }
      openDraftPortraitEditor(side, file)
    }

  const handleDraftPortraitUpload =
    (side: 'a' | 'b') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      if (!isImportImageFile(file)) {
        flashStatus(ui.invalidImageType)
        event.target.value = ''
        return
      }
      openDraftPortraitEditor(side, file)
      event.target.value = ''
    }

  const handleDraftImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!isImportTxtFile(file)) {
      flashStatus(ui.invalidTxtType)
      event.target.value = ''
      return
    }

    await parseDraftImportFromFile(file)
    event.target.value = ''
  }

  const createFightFromDraft = async () => {
    if (!draftPayload) {
      flashStatus(ui.draftNeedTxt)
      return null
    }
    if (!draftPortraitFileA || !draftPortraitFileB) {
      flashStatus(ui.draftNeedPortraits)
      return null
    }

    try {
      const [portraitADataUrl, portraitBDataUrl] = await Promise.all([
        readFileAsDataUrl(draftPortraitFileA),
        readFileAsDataUrl(draftPortraitFileB),
      ])

      const fight = createManualFightRecord({
        draftPayload,
        draftTxtFileName,
        portraitADataUrl,
        portraitBDataUrl,
        draftPortraitAdjustA,
        draftPortraitAdjustB,
        fallbackNewFightName: tr('Nowa Walka', 'New Fight'),
      })

      setFights((current) => insertManualFightRecord(current, fight))
      setDraftPayload(null)
      setDraftTxtFileName('')
      clearDraftPortraits()
      flashStatus(`${ui.fightAdded}: ${fight.name}`)
      return fight
    } catch {
      flashStatus(ui.importFailed)
      return null
    }
  }

  useEffect(
    () => () => {
      const oldA = draftPortraitPreviewRef.current.a
      const oldB = draftPortraitPreviewRef.current.b
      if (oldA) URL.revokeObjectURL(oldA)
      if (oldB) URL.revokeObjectURL(oldB)
      const editorPreview = portraitEditorPreviewRef.current
      if (editorPreview && editorPreview.startsWith('blob:')) URL.revokeObjectURL(editorPreview)
    },
    [],
  )

  useEffect(() => {
    portraitEditorPreviewRef.current = portraitEditor?.previewUrl || null
  }, [portraitEditor])

  return {
    draftPayload,
    draftTxtFileName,
    draftPortraitFileA,
    draftPortraitFileB,
    draftPortraitPreviewA,
    draftPortraitPreviewB,
    draftPortraitAdjustA,
    draftPortraitAdjustB,
    portraitEditor,
    activeDropTarget,
    draftTxtInputRef,
    draftPortraitInputRefA,
    draftPortraitInputRefB,
    closePortraitEditor,
    openSavedFightPortraitEditor,
    applyPortraitEditor,
    updatePortraitEditorAdjust,
    resetPortraitEditorAdjust,
    togglePortraitEditorSide,
    handleDropZoneDragEnter,
    handleDropZoneDragOver,
    handleDropZoneDragLeave,
    handleTxtDrop,
    handlePortraitDrop,
    handleDraftPortraitUpload,
    handleDraftImportFile,
    createFightFromDraft,
  }
}
