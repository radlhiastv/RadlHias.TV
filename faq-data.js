// ---- FAQ DATA (geteilt zwischen index.html und weiteren Seiten) ----
// ---- FAQ DATA ----
const faqData = {
  hersteller_allgemein: {
    frage: 'Ist Hersteller XY gut? Ist ein Fahrrad von Hersteller XY ein gutes Fahrrad?',
    antwort: `Diese Frage lässt sich nicht pauschal beantworten – und jeder der das behauptet, macht es sich zu einfach.<br><br>
    Die meisten Fahrradhersteller bauen Räder in verschiedenen Preisklassen, die für verschiedene Arten von Kunden gedacht sind. Nehmen wir KTM Fahrrad als Beispiel: KTM baut sehr gute Räder für alle Arten von Radfahrern. Kauft ein Kunde ein Rad das nicht zu ihm passt, hat nicht KTM etwas falsch gemacht – sondern der Verkäufer den Bedarf falsch ermittelt, oder der Kunde hat sich am Ende für das falsche Rad entschieden. Genauso verhält es sich bei allen anderen Herstellern. Egal ob Online-Direktversand oder stationär vertriebene Marke.<br><br>
    <strong>Was steckt eigentlich in einem Fahrrad?</strong><br><br>
    Bezieht man sich allein auf die Teile, lässt sich sagen: die Rahmen werden heute bei fast allen Marken in Asien produziert. Ob bei deutschen Marken wie Stevens, Rose, Canyon oder Gudereit, oder bei österreichischen Marken wie KTM Fahrrad oder Simplon – der Rahmen kommt in der Regel aus Asien. Und das ist kein Qualitätsmerkmal, das man verstecken müsste. Asiatische Rahmenhersteller haben inzwischen deutlich mehr Erfahrung im Rahmenbau, effizientere Fertigungssysteme und günstigere Produktionskosten als die meisten europäischen Hersteller. Das macht asiatisch produzierte Rahmen nicht schlechter – sondern preisgünstiger bei gleicher oder höherer Qualität.<br><br>
    Und wenn man an alle anderen Teile eines Fahrrads denkt: jeder Fahrradhersteller kauft dieselben Anbauteile bei denselben Lieferanten. Shimano, SRAM, RockShox, Ritchey – diese Komponenten findest du bei Rädern aller Marken und Preisklassen.<br><br>
    <strong>Was macht dann den Unterschied?</strong><br><br>
    Die Fahrradhersteller kochen alle mit dem gleichen Wasser. Das Salz in der Suppe sind die Kombinationen aus individueller Rahmengeometrie, der Auswahl der Anbauteile – und am Ende der Service, den man einem Käufer gegenüber bietet. Genau dort trennt sich die Spreu vom Weizen. Nicht beim Markennamen.`
  },
  laufradgroesse: {
    frage: '27,5" oder 29"? Wie groß sollten die Räder sein?',
    antwort: `Diese Frage wird im Fahrradhandel oft so gestellt, als wäre eine der beiden Größen grundsätzlich besser. Das stimmt nicht. Die Antwort hängt vom Fahrer, vom Einsatzbereich und vom Rad ab.<br><br>
    <strong>Was die Physik sagt</strong><br><br>
    Ein größeres Laufrad rollt bei gleicher Kraft leichter über Hindernisse hinweg – das ist ein geometrischer Fakt. Ein 29"-Rad trifft einen Stein oder eine Wurzel in einem flacheren Winkel als ein 27,5"-Rad, was den Widerstand reduziert und das Rad ruhiger laufen lässt. Dafür ist ein größeres Rad schwerer, hat mehr Massenträgheit beim Beschleunigen und reagiert etwas langsamer auf Lenkbewegungen.<br><br>
    <strong>Was das in der Praxis bedeutet</strong><br><br>
    29" ist die effizientere Wahl für XC-Fahrer und alle die viel Strecke machen – bergauf, auf langen Trails, bei höheren Geschwindigkeiten. Das Rad rollt besser und ermüdet weniger. Für größere Fahrer ab etwa 175 cm passt 29" auch geometrisch gut.<br><br>
    27,5" ist agiler, direkter in der Reaktion und macht besonders im technischen Gelände Spaß. Engere Kurven, schnelle Richtungswechsel, verspieltes Fahren auf kurzen Trails – das liegt 27,5" besser. Für kleinere Fahrer unter 175 cm ist 27,5" oft auch die sinnvollere Wahl, weil ein 29"-Rahmen in kleinen Größen geometrische Kompromisse erzwingt.<br><br>
    <strong>Das Mullet-Setup als dritte Option</strong><br><br>
    Wer das Beste aus beiden Welten will, greift zum Mullet-Setup: 29" vorne, 27,5" hinten. Das größere Vorderrad rollt ruhiger über Hindernisse und gibt Sicherheit bergab, das kleinere Hinterrad sorgt für Agilität und ermöglicht engere Kurvenradien. Dieses Setup hat sich in den letzten Jahren besonders im Trail- und Enduro-Bereich etabliert – nicht als Kompromiss, sondern als bewusste Entscheidung.<br><br>
    <strong>Zusammengefasst</strong><br><br>
    Es gibt keine universell richtige Antwort. Wer viel Strecke fährt und Effizienz schätzt, liegt mit 29" richtig. Wer technische Trails mag und Agilität sucht, greift zu 27,5". Und wer sich nicht entscheiden kann oder will – der fährt Mullet.`
  },
  haendler_vs_online: {
    frage: 'Händler oder Online kaufen – wo kaufe ich besser?',
    antwort: `Diese Frage lässt sich nicht pauschal beantworten – sie hängt davon ab, wie viel Erfahrung du mitbringst und was du vom Kauf erwartest.<br><br>
    Ein Fahrradhändler vor Ort bietet dir Beratung, eine Probefahrt und einen Ansprechpartner wenn etwas nicht passt. Du kannst das Rad anfassen, sitzen, fahren – und direkt entscheiden. Das hat seinen Preis. Der Händler-Aufschlag ist real, aber für viele Menschen gut investiert. Wer sein Rad bei Problemen einfach abgeben und abholen will, ist beim Händler richtig.<br><br>
    Online-Direktversender wie Canyon oder Rose bieten in vielen Fällen mehr Rad fürs gleiche Geld – weil der Handel-Aufschlag entfällt. Das ist ein echter Vorteil. Der Nachteil: keine Probefahrt, kein lokaler Service, und bei Problemen bist du auf dich allein gestellt oder wickelst alles über den Versand ab.<br><br>
    Meine Empfehlung ist einfach: Wer selbst schraubt oder eine gute Werkstatt in der Nähe hat – kauft online und spart. Wer das Rad immer zum Händler bringt und persönlichen Service braucht – kauft beim Händler. Beides ist richtig. Es kommt auf die Situation an.`
  },
  budget: {
    frage: 'Was ist ein realistisches Budget für ein gutes Fahrrad?',
    antwort: `Die ehrliche Antwort: Es gibt kein universelles Budget – aber es gibt eine Untergrenze, unter der man sich Probleme kauft statt ein Fahrrad.<br><br>
    Räder im untersten Preissegment haben oft minderwertige Bremsen, schwere Rahmen und Schaltungen die sich kaum einstellen lassen und schnell verschleißen. Das Rad macht keinen Spaß, kostet in der Wartung unverhältnismäßig viel – und landet oft nach kurzer Zeit ungenutzt im Keller.<br><br>
    Als grobe Orientierung: Wer gelegentlich fährt, ist mit einem soliden Einsteiger-Rad gut bedient. Wer regelmäßig unterwegs ist – ob im Alltag oder sportlich – sollte in die Mittelklasse investieren. Hydraulische Scheibenbremsen, eine anständige Schaltung und ein Rahmen der mehrere Jahre hält, sind hier Standard. Wer sehr viel fährt oder sportlich ambitioniert ist, bekommt in der oberen Mittelklasse wirklich gute Technik. Alles darüber ist Spezialisierung – leichter, präziser, teurer. Nur sinnvoll wenn man weiß warum man es braucht.<br><br>
    Die wichtigste Faustregel: Lieber einmal richtig kaufen als zweimal. Ein gutes Rad macht mehr Freude, hält länger und kostet weniger in der Wartung.`
  },
  hardtail_vs_fully: {
    frage: 'Hardtail oder Fully – was brauche ich wirklich?',
    antwort: `Ein Fully – also ein vollgefedertes Mountainbike – klingt zunächst nach der besseren Wahl. Mehr Federung, mehr Komfort, mehr Kontrolle. Das stimmt – aber nur wenn das Rad auch dazu passt, wie und wo man fährt.<br><br>
    Ein Hardtail hat nur eine Federgabel vorne, keinen Hinterbau-Dämpfer. Das macht es leichter, steifer und effizienter beim Treten – besonders bergauf und auf schnellen Schotterwegen. Wartung und Kosten sind deutlich geringer, weil der Dämpfer am Hinterbau entfällt. Für Einsteiger, XC-Fahrer und alle die viel Strecke machen, ist ein Hardtail oft die vernünftigere Wahl.<br><br>
    Ein Fully macht dann Sinn, wenn man wirklich technische Trails fährt – also Singletrails mit Wurzeln, Felsen, Drops und Sprüngen. Der Hinterbau-Dämpfer schluckt Unebenheiten, gibt mehr Grip am Hinterrad und macht das Rad stabiler bergab. Wer das nicht braucht, zahlt für Technik die ihm keinen Vorteil bringt.<br><br>
    Die häufigste Fehlentscheidung ist ein billiges Fully. Ein günstiges Fully mit schlechtem Fahrwerk ist in fast allen Situationen schlechter als ein gutes Hardtail. Das Geld ist am falschen Ort investiert. Wer ein Fully will, sollte bereit sein dafür zu zahlen – und den regelmäßigen Fahrwerk-Service einkalkulieren.`
  },
  alu_vs_carbon: {
    frage: 'Aluminium oder Carbon – lohnt sich der Aufpreis?',
    antwort: `Carbon ist leichter, steifer und dämpft Vibrationen besser als Aluminium. Das sind Fakten. Aber die Frage ist nicht ob Carbon besser ist – die Frage ist ob der Unterschied für den jeweiligen Fahrer und Einsatz relevant ist.<br><br>
    Ein guter Aluminium-Rahmen ist robust, günstig in der Reparatur und verträgt Stürze und Kratzer ohne dass man sich sofort Sorgen macht. Aluminium rostet nicht, ist weltweit verfügbar und lässt sich in jeder Werkstatt bearbeiten. Für den Alltag, für Einsteiger und für alle die kein Rennen fahren, ist Aluminium die vernünftigere Wahl.<br><br>
    Carbon bringt spürbaren Vorteil dort wo Gewicht und Steifigkeit wirklich eine Rolle spielen – also im Rennsport, bei langen sportlichen Ausfahrten oder wenn man bewusst in Leistung investiert. Carbon verzeiht keine Fehler: ein harter Sturz oder ein falsches Einspannen im Werkzeug kann einen Riss verursachen der von außen unsichtbar ist. Das Rad muss dann geprüft werden – im Zweifel ist es Schrott.<br><br>
    Meine Einschätzung: Wer unter 80 kg ist, viel fährt und Leistung schätzt – Carbon macht Sinn. Für alle anderen ist ein hochwertiger Aluminium-Rahmen die ehrlichere Wahl. Das gesparte Geld ist in besseren Komponenten deutlich besser investiert.`
  },
  ebike_wann: {
    frage: 'E-Bike – wann macht es wirklich Sinn?',
    antwort: `Ein E-Bike ist kein Schummeln und kein Luxusprodukt. Es ist ein Werkzeug – und wie jedes Werkzeug macht es dort Sinn, wo es die Aufgabe besser erledigt als die Alternative.<br><br>
    Ein E-Bike macht Sinn wenn das Fahrrad ohne Motor schlicht nicht genutzt würde. Lange Strecken, viele Höhenmeter, körperliche Einschränkungen, Gepäck oder das Rad als Autoersatz – das sind Situationen in denen der Motor einen echten Unterschied macht. Wer damit 5 km zur Arbeit fährt, auf flachem Terrain und ohne gesundheitliche Einschränkungen, braucht kein E-Bike.<br><br>
    Was viele nicht einkalkulieren: Ein E-Bike ist schwerer, teurer in der Anschaffung und teurer in der Wartung. Bremsen und Reifen verschleißen schneller weil man schneller fährt und mehr Gewicht bremst. Der Akku ist ein Verschleißteil mit begrenzter Lebensdauer – nach 3 bis 7 Jahren ist ein Ersatz fällig. Das gehört in die Gesamtrechnung.<br><br>
    Wer ein E-Bike kauft, sollte auf einen etablierten Antrieb achten – Bosch, Shimano Steps oder Brose. Bei unbekannten Eigenentwicklungen ist die Ersatzteilversorgung in fünf Jahren unsicher. Das kann teuer werden.`
  },
  gebraucht_kaufen: {
    frage: 'Gebrauchtes Fahrrad kaufen – worauf muss ich achten?',
    antwort: `Ein gebrauchtes Fahrrad kann ein sehr guter Kauf sein – oder eine teure Enttäuschung. Der Unterschied liegt darin, was man vor dem Kauf prüft.<br><br>
    Das Wichtigste zuerst: der Rahmen. Risse, Dellen oder Knicke am Rahmen sind ein absolutes Ausschlusskriterium – besonders bei Carbon, wo Schäden von außen oft unsichtbar sind. Bei Aluminium sieht man Schäden meist deutlicher, aber auch hier gilt: Im Zweifel nicht kaufen.<br><br>
    Die Kette ist der beste Hinweis auf den Pflegezustand des gesamten Rades. Eine stark verschlissene oder verrostete Kette zeigt, dass das Rad wenig oder gar nicht gepflegt wurde. Das zieht sich in der Regel durch alle anderen Komponenten.<br><br>
    Bremsen prüfen: Belagdicke, Rotorzustand, ob die Bremse zieht ohne zu schleifen. Schaltung: sauber und präzise schalten, kein Springen auf der Kassette. Federung: Gabel auf Ölaustritt und gleichmäßiges Einfedern prüfen.<br><br>
    Was man nicht kaufen sollte: Räder ohne Herkunftsnachweis bei auffällig niedrigem Preis. Gestohlene Fahrräder sind ein echtes Problem im Gebrauchtmarkt. Ein seriöser Verkäufer hat Kaufbeleg oder Rahmennummer parat.`
  },
  shimano_vs_sram: {
    frage: 'Shimano oder SRAM – was ist besser?',
    antwort: `Beide Hersteller bauen sehr gute Schaltungen. Die Frage ist nicht welche besser ist – sondern welche besser zu dir passt.<br><br>
    Shimano ist der Weltmarktführer mit dem größten Händlernetz. Ersatzteile sind überall verfügbar, jede Werkstatt kennt Shimano in- und auswendig, und die Schaltungen sind bekannt für ihre Zuverlässigkeit und einfache Wartung. Für Einsteiger und alle die ihr Rad zur Werkstatt bringen, ist Shimano die unkompliziertere Wahl.<br><br>
    SRAM bietet oft leichtere Komponenten, eine andere Ergonomie am Schalthebel und mit dem AXS-System eine der besten elektronischen Schaltungen am Markt. Wer SRAM kennt und schätzt, bleibt dabei – aber Ersatzteile sind teurer, und nicht jede Werkstatt ist gleich gut aufgestellt.<br><br>
    Meine Empfehlung: Wer keine Präferenz hat, fängt mit Shimano an. Die Lernkurve ist flacher, die Verfügbarkeit besser, die Kosten geringer. Wer gezielt zu SRAM wechselt, sollte wissen warum – und bereit sein, das zu bezahlen.`
  },
  einfach_vs_zweifach: {
    frage: '1-fach oder 2-fach Antrieb – was brauche ich?',
    antwort: `Vor einigen Jahren war 2-fach – also zwei Kettenblätter vorne – der Standard. Heute ist 1-fach bei MTBs die Regel, und auch bei Gravelbikes und Trekkingrädern immer häufiger zu finden. Der Grund ist einfach: moderne Kassetten mit großer Übersetzungsbandbreite machen einen Umwerfer in vielen Fällen überflüssig.<br><br>
    1-fach ist einfacher, leichter und wartungsärmer. Kein Umwerfer, kein zusätzliches Schaltseil, weniger Fehlerquellen. Die Schaltung ist schneller bedienbar weil man nur einen Schalthebel hat. Für MTBs und sportliche Einsätze ist 1-fach heute die klare Empfehlung.<br><br>
    2-fach macht noch Sinn wenn man sehr fein abgestufte Übersetzungen braucht – also im Rennrad- und Zeitfahrbereich, oder wenn man sehr flaches und sehr steiles Gelände kombiniert und dabei jeden Zahn der Kassette optimal nutzen will. Für die meisten Alltagsfahrer und Freizeitsportler ist der Vorteil von 2-fach heute kaum noch spürbar.`
  },
  tubeless: {
    frage: 'Tubeless – lohnt sich der Aufwand?',
    antwort: `Tubeless bedeutet: kein Schlauch im Reifen. Die Luft wird direkt im Reifen gehalten, abgedichtet durch ein spezielles Felgenband, ein Ventil und eine Dichtmilch im Reifen.<br><br>
    Der größte Vorteil ist der niedrigere Luftdruck. Ohne Schlauch kann man weniger Druck fahren ohne das Risiko eines Plattfußes durch einen eingeklemmten Schlauch – das verbessert den Grip und den Fahrkomfort spürbar, besonders im Gelände. Kleine Einstiche durch Dornen oder Glassplitter werden von der Dichtmilch automatisch geschlossen.<br><br>
    Der Aufwand beim Aufziehen ist höher als bei einem normalen Reifen – besonders beim ersten Mal. Die Dichtmilch muss alle drei bis sechs Monate erneuert werden, sonst trocknet sie aus und verliert ihre Wirkung. Bei einem größeren Riss hilft nur ein Schlauch als Notlösung – den sollte man trotzdem dabei haben.<br><br>
    Meine Einschätzung: Für MTBs und Gravelbikes lohnt sich Tubeless klar. Für Rennräder ist es sinnvoll wenn man bereit ist für den Aufwand beim Setup. Für Trekking- und Alltagsräder auf befestigtem Untergrund ist der Aufwand größer als der Nutzen.`
  },
  federweg: {
    frage: 'Welche Federweglänge brauche ich wirklich?',
    antwort: `Federweg ist die Strecke die eine Federgabel oder ein Hinterbau-Dämpfer einfedert. Mehr Federweg bedeutet mehr Potenzial für grobes Gelände – aber auch mehr Gewicht, mehr Wartungsaufwand und eine veränderte Geometrie des Rades.<br><br>
    Für XC und schnelle Schotterwege reichen 100 bis 120 mm. Das Rad bleibt effizient und reaktionsschnell. Für Trail-Fahren im gemischten Gelände sind 130 bis 150 mm der sinnvolle Bereich. Wer viel bergab fährt, technische Trails mit Drops und Sprüngen nutzt oder im Enduro-Bereich unterwegs ist, braucht 160 mm oder mehr.<br><br>
    Der häufigste Fehler ist zu viel Federweg für zu wenig Gelände. Ein Rad mit 170 mm Federweg auf Forstwegen und gelegentlichem Singletrail ist schwerer, träger und weniger effizient als es sein müsste. Federweg kostet immer etwas – an Gewicht, Effizienz und Wartungsaufwand. Man sollte nur so viel nehmen wie man wirklich braucht.`
  },
  luftdruck: {
    frage: 'Luftdruck in Reifen – wie viel ist richtig?',
    antwort: `Es gibt keine universelle Antwort – der richtige Luftdruck hängt vom Fahrergewicht, dem Reifenquerschnitt, dem Untergrund und dem persönlichen Fahrgefühl ab.<br><br>
    Als Ausgangspunkt gilt: Schmalere Reifen brauchen mehr Druck, breite Reifen weniger. Schwere Fahrer fahren mehr Druck als leichte. Auf hartem Untergrund fährt man mehr Druck als im losen Gelände. Die meisten Reifenhersteller drucken einen Mindest- und Höchstwert auf die Reifenflanke – das ist der technisch zulässige Bereich, nicht die Empfehlung für optimale Performance.<br><br>
    Der beste Weg zum richtigen Druck ist ausprobieren. Wer zu viel Druck fährt, spürt jeden Stein – das Rad hüpft statt zu rollen. Wer zu wenig Druck fährt, riskiert bei Schläuchen einen Platten durch einen eingeklemmten Schlauch, und das Fahrverhalten wird schwammig. Tubeless-Fahrer können generell etwas weniger Druck fahren als mit Schlauch.<br><br>
    Ein gutes Reifendruckmessgerät ist eine sinnvolle Investition. Der eingebaute Druckmesser an der Pumpe ist oft ungenau.`
  },
  wartung_intervall: {
    frage: 'Wie oft muss ein Fahrrad gewartet werden?',
    antwort: `Öfter als die meisten denken – und weniger aufwendig als viele befürchten.<br><br>
    Das Wichtigste ist die Kette. Eine verschmutzte oder trockene Kette verschleißt sich selbst und nimmt dabei Kassette und Kettenblatt mit. Wer die Kette nach Fahrten im Regen oder Schmutz reinigt und regelmäßig ölt, verlängert die Lebensdauer aller Antriebskomponenten erheblich. Das dauert wenige Minuten und spart im Laufe der Zeit viel Geld.<br><br>
    Die Bremsen sollte man regelmäßig auf Belagdicke und Funktion prüfen. Hydraulische Bremsen brauchen in der Regel alle ein bis zwei Jahre frisches Bremsöl. Schaltung und Züge verstellen sich über die Zeit – wer das früh erkennt und nachstellt, vermeidet größere Probleme.<br><br>
    Eine jährliche Komplettkontrolle beim Händler ist sinnvoll – auch für jemanden der selbst schraubt. Ein zweites Paar Augen findet Dinge die man selbst übersieht. Wer eine Federgabel hat, sollte deren Serviceintervall kennen und einhalten.`
  },
  kette: {
    frage: 'Wann muss die Kette gewechselt werden?',
    antwort: `Rechtzeitig – und nicht erst wenn sie reißt oder die Schaltung anfängt zu springen.<br><br>
    Eine Kette verschleißt durch Dehnung. Die einzelnen Glieder werden länger, passen nicht mehr exakt auf die Zähne von Kassette und Kettenblatt – und fressen sich dort hinein. Wer eine gedehnte Kette zu lange fährt, wechselt am Ende nicht nur die Kette sondern auch Kassette und Kettenblatt gleichzeitig. Das ist deutlich teurer.<br><br>
    Den Verschleiß misst man mit einer Kettenmesslehre – ein einfaches Werkzeug das es für wenige Euro gibt. Zeigt die Lehre 0,75 % Dehnung an, ist es Zeit für eine neue Kette. Bei 1,0 % ist die Kassette mit hoher Wahrscheinlichkeit auch fällig.<br><br>
    Wann das passiert hängt von der Pflege, dem Untergrund und dem Fahrstil ab. Wer die Kette regelmäßig reinigt und ölt, kommt deutlich weiter als jemand der das nie macht. Eine Kettenmesslehre im Werkzeugkasten zu haben und alle paar Wochen kurz nachzuschauen ist die günstigste Wartungsmaßnahme am Fahrrad.`
  },
  gesamtkosten: {
    frage: 'Was kostet mich ein Fahrrad wirklich – Anschaffung und laufende Kosten?',
    antwort: `Der Kaufpreis ist nur der Anfang. Ein Fahrrad hat laufende Kosten die man vor dem Kauf kennen sollte.<br><br>
    Verschleißteile wie Kette, Kassette, Bremsbeläge und Reifen müssen regelmäßig getauscht werden. Das ist normal und unvermeidbar. Wer die Kette rechtzeitig wechselt, schont die Kassette – und spart damit. Wer wartet bis alles verschlissen ist, zahlt mehr auf einmal.<br><br>
    Dazu kommen Wartungskosten: jährliche Inspektion beim Händler, bei Federgabeln der regelmäßige Service, bei hydraulischen Bremsen das Nachfüllen oder Wechseln des Öls. Das ist keine große Summe pro Jahr – aber sie gehört in die Rechnung.<br><br>
    Ein teures Rad hat oft günstigere laufende Kosten als ein billiges. Hochwertigere Komponenten halten länger, sind präziser einzustellen und haben günstigere Ersatzteile im Verhältnis zur Lebensdauer. Ein billiges Rad das ständig zur Werkstatt muss, ist am Ende teurer als ein einmalig gut investiertes Budget.`
  },
  federgabel_service: {
    frage: 'Federgabel – wann muss sie gewartet werden?',
    antwort: `Eine Federgabel ist ein wartungsintensives Bauteil – das wird beim Kauf selten erwähnt und von den meisten Fahrern jahrelang ignoriert. Das rächt sich.<br><br>
    Im Inneren der Federgabel befindet sich Öl. Dieses Öl schmiert die beweglichen Teile, dämpft die Federbewegung und schützt die Dichtungen. Mit der Zeit altert das Öl, verliert seine Eigenschaften und wird dünnflüssiger. Die Gabel wird langsamer, unpräziser – in Extremfällen schädigt das verbrauchte Öl die Dichtungen, und die sind teuer.<br><br>
    Die meisten Hersteller empfehlen ein Serviceintervall von 100 bis 200 Betriebsstunden. Das klingt viel – ist es aber nicht wenn man regelmäßig fährt. Ein einfaches Service der unteren Beinchen kostet in der Werkstatt einen überschaubaren Betrag und sollte einmal im Jahr gemacht werden. Ein vollständiges Serviceintervall inklusive Dämpferkartusche ist aufwendiger und teurer, aber bei intensiver Nutzung nach ein bis zwei Jahren sinnvoll.<br><br>
    Erkennungszeichen für fälliges Service: Öl auf den Standrohren, Geräusche beim Einfedern, deutlich schlechteres Ansprechverhalten als früher.`
  },
  selbst_warten: {
    frage: 'Kann ich mein Fahrrad selbst warten oder brauche ich eine Werkstatt?',
    antwort: `Beides ist möglich – und es muss keine Entscheidung für das eine oder andere sein.<br><br>
    Einfache Wartungsarbeiten kann praktisch jeder selbst erledigen: Kette reinigen und ölen, Luftdruck prüfen, Schaltung nachjustieren, Bremsbeläge kontrollieren. Das braucht kein teures Werkzeug, lässt sich mit ein paar YouTube-Videos lernen und spart über die Jahre eine Menge Geld.<br><br>
    Komplexere Arbeiten wie das Entlüften hydraulischer Bremsen, der Service einer Federgabel oder das Einstellen eines Lagers erfordern mehr Erfahrung und spezifisches Werkzeug. Wer das lernen will – sehr gut. Wer es nicht will – kein Problem. Dafür gibt es Werkstätten.<br><br>
    Der praktischste Ansatz für die meisten Fahrer: Routine-Pflege selbst machen, komplexe Eingriffe zur Werkstatt bringen. Das spart Geld ohne das Rad zu riskieren. Und eine jährliche Inspektion beim Händler ist auch für erfahrene Selbstschrauber sinnvoll – ein zweites Paar Augen findet Dinge die man selbst übersieht.`
  },
  kauffehler: {
    frage: 'Welche Fehler machen die meisten beim ersten Fahrradkauf?',
    antwort: `Der häufigste Fehler ist das falsche Rad für den falschen Einsatz. Ein vollgefedertes Mountainbike für den Weg zur Arbeit, ein Trekkingrad für sportliche Trails, ein Rennrad für Schotterwege – Räder sind für bestimmte Einsatzbereiche entwickelt und funktionieren außerhalb davon schlechter. Der erste Schritt vor jedem Kauf sollte immer die ehrliche Antwort auf die Frage sein: Wo und wie fahre ich wirklich – nicht wie ich gerne fahren würde.<br><br>
    Der zweite häufige Fehler ist zu wenig Budget. Ein billiges Fahrrad ist selten ein gutes Geschäft. Minderwertige Bremsen, eine Schaltung die sich nicht sauber einstellen lässt, ein Rahmen der nach zwei Jahren Probleme macht – das ist keine Ersparnis sondern ein aufgeschobener Mehraufwand.<br><br>
    Der dritte Fehler ist, die Größe zu ignorieren. Ein falsch großes Rad macht keinen Spaß, belastet Rücken und Gelenke und lässt sich nicht sicher fahren. Rahmengröße, Schrittlänge und Körpergröße gehören zusammen – und kein Händler der wirklich berät, überspringt diesen Schritt.`
  },
  billig_teurer: {
    frage: 'Warum ist billig oft teurer?',
    antwort: `Weil ein billiges Fahrrad fast immer höhere Folgekosten hat als ein teureres.<br><br>
    Günstige Schaltungen verschleißen schneller und sind schwerer einzustellen. Günstige Bremsen haben weniger Bremsleistung und kürzere Belag-Lebensdauern. Günstige Rahmen sind schwerer und weniger steif – was das Fahren weniger effizient und weniger angenehm macht. Günstige Lager laufen kürzer, günstige Züge rosten schneller, günstige Reifen greifen schlechter.<br><br>
    Das bedeutet nicht, dass jedes günstige Rad schlecht ist. Aber es bedeutet, dass man für wenig Geld in der Regel Kompromisse kauft – und diese Kompromisse haben einen Preis, der sich über die Zeit in Wartungskosten, Ersatzteilen und Enttäuschung ausdrückt.<br><br>
    Das teuerste Fahrrad ist das, das man nicht benutzt weil es keinen Spaß macht. Und das zweitteuerste ist das, das ständig Probleme macht. Ein einmalig gut investiertes Budget ist fast immer die günstigere Entscheidung auf lange Sicht.`
  },
  helm_alter_und_kauf: {
    frage: 'Fahrradhelm – wie alt darf er sein, und worauf kommt es wirklich an?',
    antwort: `Ein Helm der zehn Jahre alt ist und nie runtergefallen ist, sieht von außen gut aus. Er schützt dich aber nicht mehr so wie am ersten Tag. Warum – und was du wirklich wissen musst.<br><br>
    <strong>Wie alt darf ein Helm sein?</strong><br><br>
    Die offizielle Empfehlung der meisten Hersteller – darunter Giro, Bell, Scott und Uvex – lautet: <strong>maximal 5 Jahre ab Kaufdatum, oder sofort nach einem Sturz.</strong> Das klingt streng, hat aber einen guten Grund: Das Styropor im Inneren des Helms (EPS – Expanded Polystyrene) altert. UV-Strahlung, Schweiß, Reinigungsmittel und Temperaturschwankungen greifen das Material an – unsichtbar, aber messbar. Ein alter Helm bricht bei einem Aufprall anders als ein neuer – und das bedeutet weniger Schutz für deinen Kopf.<br><br>
    Faustregel: Wer seinen Helm nicht mehr datieren kann oder ihn gebraucht gekauft hat, sollte ihn ersetzen.<br><br>
    <strong>Nach einem Sturz: sofort wechseln</strong><br><br>
    Das ist kein Marketing-Trick der Hersteller. EPS ist ein Einweg-Dämpfungsmaterial: Es absorbiert die Aufprallenergie beim ersten Einschlag – danach ist es dauerhaft verformt, auch wenn von außen nichts zu sehen ist. Wer nach einem Sturz mit demselben Helm weiterfährt, riskiert beim nächsten Aufprall ungeschützt zu sein. Manche Hersteller (z. B. Specialized, Trek) bieten einen kostengünstigen Crash-Replacement-Service an – das lohnt sich zu kennen.<br><br>
    <strong>Welche Norm ist Pflicht?</strong><br><br>
    In Europa gilt für Fahrradhelme die Norm <strong>EN 1078</strong>. Jeder im Handel erhältliche Helm muss diese Norm erfüllen – das ist gesetzlich vorgeschrieben. Auf dem Helm selbst (meist innen) ist das CE-Zeichen mit der Norm aufgedruckt. Wer einen Helm kauft, der kein CE-Zeichen trägt, kauft keinen Schutz.<br><br>
    Darüber hinaus gibt es freiwillige Tests wie den <strong>MIPS-Standard</strong> (Multi-directional Impact Protection System) – eine zusätzliche Schicht im Helm, die bei schrägen Aufprällen die Rotationskräfte auf das Gehirn reduziert. MIPS ist kein Pflichtstandard, aber sinnvoll – besonders für MTB- und Gravel-Fahrer die auch im Gelände unterwegs sind. Mittlerweile ist MIPS auch in vielen erschwinglichen Helmen erhältlich.<br><br>
    <strong>Passform – das wichtigste Kaufkriterium</strong><br><br>
    Ein Helm der nicht sitzt, schützt nicht. Ein Helm muss fest am Kopf anliegen – kein Wackeln nach vorne, hinten oder seitlich. Der Kinnriemen schließt direkt unter dem Kinn, mit einem Finger Luft dazwischen. Die Verstellspindel am Hinterkopf wird so fest gedreht, dass der Helm nicht mehr nach vorne rutscht wenn man den Kopf neigt.<br><br>
    Kopfformen sind unterschiedlich: manche Köpfe sind runder, andere eher oval. Nicht jeder Helm passt zu jeder Kopfform – auch wenn die Umfangsgröße stimmt. Wer die Möglichkeit hat, sollte Helme immer vor dem Kauf anprobieren.<br><br>
    <strong>Preis und Qualität</strong><br><br>
    Ein teurer Helm ist nicht zwingend sicherer als ein günstiger – beide müssen dieselbe Norm erfüllen. Was ein höherer Preis bringt: mehr Belüftung (mehr Luft, weniger Material → leichter und kühler), bessere Verarbeitungsqualität, MIPS, und in vielen Fällen eine bessere Passform-Anpassung. Für gelegentliche Stadtfahrten reicht ein solider Einsteiger-Helm. Für sportliche Einsätze, lange Ausfahrten oder Geländefahrten lohnt sich mehr Investition – weil Komfort und Passform hier direkt die Sicherheit beeinflussen.<br><br>
    <strong>Zusammengefasst</strong><br><br>
    Maximales Helmalter: 5 Jahre. Nach jedem Sturz mit Aufprall: sofort ersetzen. CE-Zeichen mit EN 1078 ist Pflicht. MIPS ist sinnvoll. Und das wichtigste Kaufkriterium ist nicht der Preis – sondern die Passform.`
  },
  reifendruck_8bar: {
    frage: 'Rennradreifen mit 8 bar – stimmt diese Empfehlung noch?',
    antwort: `Die kurze Antwort: Nein – zumindest nicht pauschal. 8 bar war jahrzehntelang die Standardempfehlung für schmale Rennradreifen. Sie ist aber mittlerweile wissenschaftlich überholt.<br><br>
    <strong>Woher kommt die „8 bar"-Regel?</strong><br><br>
    Die Empfehlung stammt ursprünglich aus dem Bahnradsport – also aus dem Velodrom, auf spiegelglattem Betonboden. Dort gilt tatsächlich: mehr Druck = weniger Walkarbeit = weniger Rollwiderstand. Diese Erkenntnis wurde damals unkritisch auf den Straßeneinsatz übertragen und hat sich als Faustregel festgesetzt.<br><br>
    <strong>Was die moderne Forschung zeigt</strong><br><br>
    Forscher wie Jan Heine (Rene Herse Cycles), das SILCA-Team und Schwalbe haben in den letzten 15 Jahren nachgewiesen, dass auf echten Straßenbelägen das Gegenteil gilt: Zu viel Druck lässt den Reifen über Mikro-Unebenheiten <em>hüpfen</em> statt darüber zu rollen. Das kostet Energie, verschlechtert die Bodenhaftung – besonders bei Nässe – und erhöht den Reifenverschleiß.<br><br>
    Der optimale Druck liegt dort, wo der Reifen gerade genug nachgeben kann, um sich an den Belag anzupassen. Auf realen Straßen ist das ein spürbar niedrigerer Wert als das aufgedruckte Maximum.<br><br>
    <strong>Was moderne Empfehlungen sagen</strong><br><br>
    Für einen Fahrer mit 80 kg Körpergewicht auf 23 mm schmalen Reifen empfehlen SILCA und Schwalbe heute rund <strong>6,0–6,5 bar vorne, 7,0–7,5 bar hinten</strong>. 8 bar werden erst ab etwa 90–95 kg Fahrergewicht sinnvoll – und auch dann nur auf sehr glattem Asphalt.<br><br>
    Das Hinterrad bekommt übrigens immer etwas mehr Druck als das Vorderrad, weil es rund 57 % des Systemgewichts trägt. Das Vorderrad entsprechend weniger – ein Detail, das bei der alten Einheitsempfehlung von „8 bar" komplett ignoriert wurde.<br><br>
    <strong>Die Empfehlung des Luftdruck-Rechners</strong><br><br>
    Der Rechner in diesem Tool basiert auf den aktuellen Daten von Schwalbe Pressure Prof, SILCA Pro Calculator und dem ADAC-Reifendruckguide 2026. Er gibt dir gewichts- und reifenspezifische Werte aus – getrennt für Vorder- und Hinterrad. Das ist präziser als jede Faustregel.`
  }
};

// ---- FAQ KATEGORIEN ----
const faqKategorien = [
  {
    label: '🏭 Hersteller & Marken',
    keys: ['hersteller_allgemein']
  },
  {
    label: '🛒 Kauf & Entscheidung',
    keys: ['haendler_vs_online','budget','hardtail_vs_fully','alu_vs_carbon','ebike_wann','gebraucht_kaufen','kauffehler','billig_teurer','helm_alter_und_kauf']
  },
  {
    label: '⚙️ Technik & Komponenten',
    keys: ['laufradgroesse','shimano_vs_sram','einfach_vs_zweifach','tubeless','federweg','luftdruck','reifendruck_8bar']
  },
  {
    label: '🔧 Wartung & Kosten',
    keys: ['wartung_intervall','kette','gesamtkosten','federgabel_service','selbst_warten']
  }
];

function renderFaqAccordion() {
  const container = document.getElementById('faq-accordion');
  if (!container) return;
  let html = '';
  faqKategorien.forEach((kat, ki) => {
    html += `<div style="margin-bottom:8px;">
      <div style="font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--text-dim); padding:10px 0 6px; border-bottom:1px solid var(--cream2); margin-bottom:4px;">${kat.label}</div>`;
    kat.keys.forEach(key => {
      const item = faqData[key];
      if (!item) return;
      html += `<div class="faq-item" id="faq-item-${key}">
        <button type="button" class="faq-q" onclick="toggleFaq('${key}')">
          <span>${item.frage}</span>
          <span class="faq-chevron" id="faq-chev-${key}">›</span>
        </button>
        <div class="faq-a" id="faq-a-${key}" style="display:none;">
          <div class="faq-a-inner">${item.antwort}</div>
          <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--cream2); font-size:11px; color:var(--text-dim); font-style:italic;">Keine bezahlten Empfehlungen. Keine Werbung. Meine persönliche Meinung nach Jahren im Fahrradhandel.</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  container.innerHTML = html;
}
// renderFaqAccordion() wird via DOMContentLoaded aufgerufen
let openFaqKey = null;
function toggleFaq(key) {
  if (openFaqKey && openFaqKey !== key) {
    document.getElementById('faq-a-' + openFaqKey).style.display = 'none';
    document.getElementById('faq-chev-' + openFaqKey).style.transform = 'rotate(0deg)';
  }
  const panel = document.getElementById('faq-a-' + key);
  const chev = document.getElementById('faq-chev-' + key);
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  chev.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
  openFaqKey = isOpen ? null : key;
  if (!isOpen) {
    setTimeout(() => document.getElementById('faq-item-' + key).scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }
}
