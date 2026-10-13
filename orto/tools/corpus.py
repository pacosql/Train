# Prepara el corpus de prensa española que usa tools/generar.mjs.
# Fuente: Leipzig Corpora Collection, spa_news_2023_100K (CC BY 4.0),
# https://wortschatz.uni-leipzig.de/en/download/Spanish
# Se queda con las frases de medios de España (.es y cabeceras españolas
# .com) y cuenta palabras.  Uso:
#   python3 orto/tools/corpus.py /ruta/de/trabajo
import re, sys, os, json, collections, tarfile, urllib.request
dst = sys.argv[1] if len(sys.argv) > 1 else "/tmp/orto-corpus"
os.makedirs(dst, exist_ok=True)
tgz = os.path.join(dst, "news.tgz")
if not os.path.exists(tgz):
    urllib.request.urlretrieve("https://downloads.wortschatz-leipzig.de/corpora/spa_news_2023_100K.tar.gz", tgz)
tarfile.open(tgz).extractall(dst)
D = os.path.join(dst, "spa_news_2023_100K", "spa_news_2023_100K-")
ESP = {'www.lavanguardia.com','www.mundodeportivo.com','valenciaplaza.com','www.elconfidencialdigital.com','www.libertaddigital.com',
       'www.diariosigloxxi.com','www.elplural.com','hipertextual.com','www.antena3.com','www.lasexta.com','www.pamplonaactual.com',
       'diariodeavisos.elespanol.com','www.objetivofamosos.com','www.bolsamania.com','www.muycomputer.com','www.elmercuriodigital.net'}
src = {}
for l in open(D + "sources.txt", encoding="utf8"):
    i, u, *_ = l.rstrip("\n").split("\t"); src[i] = u
so = {}
for l in open(D + "inv_so.txt", encoding="utf8"):
    s, sent = l.split("\t")[:2]; so[sent.strip()] = src.get(s, "")
es = []
for l in open(D + "sentences.txt", encoding="utf8"):
    i, t = l.rstrip("\n").split("\t", 1)
    m = re.match(r"https?://([^/]+)/", so.get(i, ""))
    if m and (m.group(1).endswith(".es") or m.group(1) in ESP or "elespanol" in m.group(1)):
        es.append({"id": i, "t": t, "d": m.group(1)})
cnt = collections.Counter(); tot = 0
for s in es:
    for w in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", s["t"]):
        tot += 1; cnt[w] += 1
json.dump(es, open(os.path.join(dst, "es_sentences.json"), "w"), ensure_ascii=False)
json.dump({"total": tot, "freq": cnt.most_common()}, open(os.path.join(dst, "es_freq.json"), "w"), ensure_ascii=False)
print(len(es), "frases;", tot, "palabras")
