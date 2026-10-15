"""Build data.json for the Novaflow figure-booklet website. All values come from
booklet/entries.json (itself built from the xlsx/CSVs) + the top100/niche CSVs."""
import json, csv, os, shutil, math, re
FC='/workspace/fig-catalog'; S=f'{FC}/site'
E=json.load(open(f'{FC}/booklet/entries.json'))
import sys; sys.path.insert(0,f'{FC}/booklet')
from data import TYPES, TYPE_NAME, TYPE_COL
def nz(v):
    if v is None: return None
    if isinstance(v,float) and math.isnan(v): return None
    return v
pk=[]
for e in E:
    t=e['top'][0] if e.get('top') else None
    n=e['niche'][0] if e.get('niche') else None
    sc=e.get('script')
    if sc and os.path.exists(f'{FC}/{sc}'):
        dst=f'{S}/scripts/{e["dir"]}/{os.path.basename(sc)}'
        os.makedirs(os.path.dirname(dst),exist_ok=True); shutil.copy(f'{FC}/{sc}',dst)
        sc_web=f'scripts/{e["dir"]}/{os.path.basename(sc)}'
    else: sc_web=None
    imgs=[]
    for im in e['images']:
        k=f"{e['dir']}__{im['var']}"
        imgs.append(dict(key=k,var=im['var'],type=im['type'],w=im['w'],h=im['h'],
                         rel=im['rel']))
    ex=[]
    for x in (e.get('examples') or []):
        ex.append(dict(title=x.get('title'),journal=x.get('journal'),year=x.get('year'),doi=x.get('doi'),
                       fig=x.get('fig_link'),fig_label=x.get('fig_label'),offpmc=x.get('offpmc'),evidence=x.get('evidence')))
    cex=[dict(title=x.get('title'),journal=x.get('journal'),year=x.get('year'),doi=x.get('doi'),cited=x.get('cited'),pmcid=x.get('pmcid'))
         for x in (e.get('corpus_examples') or [])]
    pk.append(dict(dir=e['dir'],part=e['part'],name=e['name'],lang=e['lang'],category=e['category'],
        top=t,niche=n,script=sc_web,script_src=sc,code=e.get('code'),code_line=e.get('code_line'),
        header=e.get('header'),limits=e.get('limits') or [],examples=ex,corpus_examples=cex,
        corpus_count=nz(e.get('corpus_count')),corpus_alias=nz(e.get('corpus_alias')),
        verify=e.get('verify'),images=imgs,types=sorted({i['type'] for i in imgs})))
def rd(p):
    with open(p) as f: return list(csv.DictReader(f))
top=rd(f'{FC}/figure_package_catalog_top100.csv')
top=[{k:r[k] for k in ['rank','package','language','category','role','paper_count','pct_corpus','fulltext_any_count','typical_figure_types','recreation_status','recreation_dir','n_variations']} for r in top]
nic=rd(f'{FC}/niche_cool_catalog.csv')
nic=[{k:r[k] for k in ['niche_rank','tool','language','category','signature_visual','visual_score_1to5','neuro_total','broad_rate_2023_per1k','broad_rate_2025_26_per1k','growth_ratio','github_repo','github_stars','recreation_status','recreation_dir','n_variations']} for r in nic]
types=[dict(key=k,name=n,color=c) for k,n,c in TYPES]
out=dict(packages=pk,top100=top,niche=nic,types=types,
         n_images=sum(len(p['images']) for p in pk))
json.dump(out,open(f'{S}/data/catalog.json','w'),separators=(',',':'))
# methods/summary markdown -> copy raw for client-side render
shutil.copy(f'{FC}/METHODS.md',f'{S}/data/METHODS.md')
shutil.copy(f'{FC}/SUMMARY.md',f'{S}/data/SUMMARY.md')
print('packages',len(pk),'images',out['n_images'],'top',len(top),'niche',len(nic))
