echo. & pause
taskkill/f /im searchd.exe
cd ../../
cd sphinx/bin
indexer index_knowledge
indexer index_intercourse
searchd.exe --pidfile