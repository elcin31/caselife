"""Import our original photographic contact sheets. Arguments: cover, cast, scenes, objects, interiors, papers."""
from PIL import Image
from pathlib import Path
import sys
out = Path('public/art')
out.mkdir(parents=True, exist_ok=True)
def export(path, columns, rows, names):
    with Image.open(path) as sheet:
        for index, name in enumerate(names.split()):
            x, y = index % columns, index // columns
            w, h = sheet.size
            rect = tuple(round(n) for n in (x*w/columns, y*h/rows, (x+1)*w/columns, (y+1)*h/rows))
            img = sheet.crop(rect).convert('RGB')
            img.thumbnail((1600,1200))
            img.save(out / (name+'.webp'), quality=86, method=6)
export(sys.argv[1],1,1,'cover')
export(sys.argv[2],3,2,'orlov raisa sergey nina petr lida')
export(sys.argv[3],2,3,'study hall parlor street records bank')
export(sys.argv[4],4,4,'letter recorder radiator latch clock coat family telephone ticket receipt ledger envelope payment stamp cassette crew')
export(sys.argv[5],2,2,'office interview board drawers')

export(sys.argv[6],2,3,'report torn dispatch equity signatures plan')
