
3. Gdy pierwsze dwa punkty będą skończone, dopiero wtedy robimy czyszczenie aplikacji i szeregowanie wszystkiego. Ta aplikacja, jest tak pokręcona, skomplikowana, że czasem trudno ogarnać, za co jaka funkcja odpowiada. 
To wszystko trzeba uprościć, zatomitować, rozbić.

System wygląda tak: Templaty mają treść stałą, identyczną zawsze, dla wszystkich walk. Czyli tytuły, stopień zagrożenia, integralność danych, profil postaci, czerwony narożnik, opis postaci, atut, styl, moce, narzędzia... WSZYSTKO, co jest stałe dla każdej walki.
Z kolei plik json, w folderze Fights, mają treść zmienną, czyli inną dla każdej walki, czyli nazwy postaci, statystyki, cytaty, pokonanych przeciwników, scenariusze walki, itd. Wszystko co tyczy się tej jednej walki, i w innej walce będzie już inne, bierzemy z konkretnego folderu walki, w folderze Fights. 

I to trzeba uprościć. Fights i walki json są zrobione dobrze. Ale templaty obecne... Są zbyt skomplikowane. Templaty, tak jak nazwa mówi, muszą działać tak, że użytkownik tworzy nową walkę, robiąc prosty plik json do folderu Fights, przechodzi przez animacje, wpisuje nazwę walki, i wszystko robi się już samo. Treść z json wchodzi do kolejnych templatów, robiąc kolejną walkę do wyboru w menu Fight History, i już tam wszystko jest, treść template zawsze taka sama, i treść json, w odpowiednich miejscach, wewnątrz paneli. 

Poczyść kod, pousuwaj zbędne funkcje, uprość to wszystko, może podziel na osobne pliki to co można, żeby łatwiejsze to było wszystko do ogarnięcia.