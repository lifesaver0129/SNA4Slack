python3.6 -m venv venv
source venv/bin/activate
pip install pandas lxml textblob networkx django pymysql
git clone https://github.com/paulgirard/pygexf.git
mv pygexf/gexf venv/lib/python3.6/site-packages/
rm -r pygexf
mkdir Grapher/mention_based
