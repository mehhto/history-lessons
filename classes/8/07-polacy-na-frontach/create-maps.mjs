// Real geographic locator; contemporary boundaries, not WWII fronts.
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const assets=path.join(import.meta.dirname,'assets');
const countries=JSON.parse(await readFile(path.join(assets,'natural-earth-countries.geojson'),'utf8'));
const points=[
 {name:'Londyn',lon:-0.1257,lat:51.5085,unit:1,source:'https://voyrilo.com/coordinates/london'},
 {name:'Falaise',lon:-0.20,lat:48.89,unit:2,source:'https://www.meteo-villes.com/previsions-meteo-falaise-14700'},
 {name:'Breda',lon:4.77,lat:51.58,unit:2,source:'https://www.gaisma.com/en/location/breda.html'},
 {name:'Monte Cassino',lon:13.813889,lat:41.49,unit:3,source:'https://www.findlatitudeandlongitude.com/l/monte+cassino/3534/'},
 {name:'Cowes',lon:-1.30,lat:50.76,unit:4,source:'https://busmaps.com/en/uk/city/Cowes-2652204'},
 {name:'Lenino',lon:31.122778,lat:54.411389,unit:5,source:'https://pl.wikipedia.org/wiki/Lenino_(rejon_horecki)'},
 {name:'Driel / Arnhem',lon:5.811111,lat:51.958333,unit:6,source:'https://pl.wikipedia.org/wiki/Driel'},
 {name:'Tobruk',lon:23.966667,lat:32.083333,unit:7,source:'https://pl.wikipedia.org/wiki/Tobruk'},
 {name:'Narwik',lon:17.4272,lat:68.4384,unit:8,source:'https://geoplace.org/en/norway/narvik-09-no'}
];
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;
const unitNames=['Dywizjon 303','1. Dywizja Pancerna','2. Korpus Andersa','Marynarka · „Błyskawica”','Formacje Berlinga','Brygada Spadochronowa','Strzelcy Karpaccy','Strzelcy Podhalańscy'];
function panel(id,x,y,w,h,bounds,key=false){
 const [west,east,south,north]=bounds,scale=Math.min(w/(east-west),h/(merc(north)-merc(south)));
 const px=lon=>x+(w-scale*(east-west))/2+(lon-west)*scale,py=lat=>y+(h-scale*(merc(north)-merc(south)))/2+(merc(north)-merc(lat))*scale;
 let svg=`<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" stroke="#555"/><g clip-path="url(#${id})">`;
 for(const f of countries.features){
  const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
  const d=polys.map(poly=>poly.map(ring=>'M'+ring.map(([lon,lat])=>`${px(lon).toFixed(1)},${py(Math.max(-85,Math.min(85,lat))).toFixed(1)}`).join('L')+'Z').join('')).join('');
  svg+=`<path d="${d}" fill="#f7f7f7" stroke="#777" stroke-width=".8" fill-rule="evenodd"/>`;
 }
 const labels=id==='main'?[['NORWEGIA',9,63],['SZWECJA',17,60],['POLSKA',17,51],['NIEMCY',7,50],['FRANCJA',0,46],['WŁOCHY',7,40],['BIAŁORUŚ',23,56],['LIBIA',16,30.8],['M. ŚRÓDZIEMNE',17,36],['W. BRYTANIA',-7,55]]:[['W. BRYTANIA',-4.3,55],['FRANCJA',6,47.6],['NIDERLANDY',3,55],['BELGIA',4.8,50.2]];
 for(const [name,lon,lat] of labels)svg+=`<text x="${px(lon)}" y="${py(lat)}" class="country">${name}</text>`;
 const offsets=id==='main'?{'Londyn':[12,-13],'Monte Cassino':[12,23],'Lenino':[-89,-14],'Tobruk':[12,-14],'Narwik':[12,-14]}:{'Londyn':[-73,-28],'Cowes':[-88,22],'Falaise':[12,23],'Breda':[-50,25],'Driel / Arnhem':[-43,-29]};
 for(const p of points){
  if(p.lon<west||p.lon>east||p.lat<south||p.lat>north||!(p.name in offsets))continue;
  const [dx,dy]=offsets[p.name],cx=px(p.lon),cy=py(p.lat);
  svg+=`<circle cx="${cx}" cy="${cy}" r="3.6" fill="white" stroke="black" stroke-width="1.5"/><path d="M${cx},${cy}l${dx},${dy}" stroke="#666" stroke-width=".8"/><text x="${cx+dx}" y="${cy+dy}" class="city">${p.name}</text>`;
  if(key)svg+=`<text x="${cx+9}" y="${cy+6}" class="answer">${p.unit}</text>`;
 }
 return svg+'</g>';
}
for(const key of [false,true]){
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="710" viewBox="0 0 1000 710" role="img" aria-label="Mapa orientacyjna Europy i północnej Afryki${key?' z kluczem':' do oznaczania'}"><style>text{font-family:Arial,sans-serif;fill:black}.country{font-size:15px;letter-spacing:.5px}.city{font-size:17px;paint-order:stroke;stroke:white;stroke-width:4px;stroke-linejoin:round}.answer{font-size:24px;font-weight:bold;paint-order:stroke;stroke:white;stroke-width:4px}.legend{font-size:17px}</style>`;
 svg+=panel('main',0,0,620,684,[-12,37,30,71],key)+panel('zoom',650,38,340,230,[-5,9,47,56],key);
 svg+='<text x="650" y="24" class="legend">Powiększenie Europy Zachodniej</text><text x="650" y="306" class="legend">Wpisz numery przy miejscach:</text>';
 unitNames.forEach((name,i)=>svg+=`<text x="650" y="${340+i*34}" class="legend">${i+1}. ${name}</text>`);
 svg+='<text x="650" y="638" class="legend">○ miejscowość / rejon · góra = północ</text><text x="650" y="665" class="legend">303: zaznacz obszar koło Londynu.</text><text x="2" y="705" font-size="14">Natural Earth 1:110m · granice współczesne: orientacja, NIE granice wojenne. Punkty przybliżone; powiększenie ma inną skalę.</text></svg>';
 await writeFile(path.join(assets,key?'mapa-klucz.svg':'mapa-do-oznaczania.svg'),svg);
}
await writeFile(path.join(assets,'map-provenance.json'),JSON.stringify({dataset:'natural-earth-countries.geojson',url:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',licence:'Public domain',terms:'https://www.naturalearthdata.com/about/terms-of-use/',projection:'Mercator; uniform scale within each panel; inset independently scaled',bounds:[-12,37,30,71],points,files:await Promise.all(['mapa-do-oznaczania.svg','mapa-klucz.svg'].map(async file=>({file,sha256:createHash('sha256').update(await readFile(path.join(assets,file))).digest('hex')})))},null,2)+'\n');
