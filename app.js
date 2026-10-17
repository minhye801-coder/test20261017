'use strict';
const $ = id => document.getElementById(id);
const ids = ['date','grade','menus','selected','story','nutrition','nutrient','amount','unit','basis','source','verified','question','option0','option1','option2','option3','answer','reviewed'];
let started = false, dirty = false, showAnswer = false;
const canvas = $('poster'), ctx = canvas.getContext('2d');
function message(text, success = false) { $('message').textContent = text; $('message').className = success ? 'success' : ''; }
function state() { return Object.fromEntries(ids.map(id => [id, $(id).type === 'checkbox' ? $(id).checked : $(id).value])); }
function menuList() { return [...new Set($('menus').value.split('\n').map(x => x.trim()).filter(Boolean))]; }
function syncMenus() {
 const current = $('selected').value, list = menuList();
 $('selected').replaceChildren(new Option('소개할 메뉴를 선택하세요', ''));
 list.forEach(x => $('selected').add(new Option(x, x)));
 if (list.includes(current)) $('selected').value = current;
}
function baseError() {
 if (!$('date').value || !$('date').validity.valid) return ['급식 날짜를 입력해 주세요.', 'date'];
 if (!menuList().length) return ['급식 메뉴를 입력해 주세요.', 'menus'];
 if (!$('selected').value || !menuList().includes($('selected').value)) return ['소개할 메뉴를 선택해 주세요.', 'selected'];
 if ($('selected').value.length > 45) return ['소개할 메뉴는 45자 이내로 입력해 주세요.', 'menus'];
 return null;
}
function error(text, id) { message(text); if(id) $(id).focus(); return false; }
function valid(output = false) {
 const b = baseError(); if(b) return error(...b);
 const s = state(), quiz = s.question || [0,1,2,3].some(i => s['option'+i]) || s.answer !== '';
 if (quiz && s.answer === '') return error('퀴즈 정답을 선택한 뒤 저장해 주세요.', 'answer');
 if (quiz && (!s.question.trim() || [0,1,2,3].some(i => !s['option'+i].trim()))) return error('퀴즈 질문과 보기 네 개를 모두 입력해 주세요.', 'question');
 // Numerical nutrition claims must be recorded in the verified-data fields.
 if (/\d/.test(s.nutrition)) return error('영양 정보의 수치는 아래 검증 자료 입력란에 출처와 함께 입력해 주세요.', 'nutrition');
 if(output && (!s.story.trim() || !s.nutrition.trim() || !quiz)) return error('음식 이야기, 영양 정보, 퀴즈를 모두 작성해 주세요.', 'story');
 if(output && !s.reviewed) return error('교육 내용과 정답을 직접 확인한 뒤 확인 표시를 해 주세요.', 'reviewed');
 return true;
}
function gradeInfo() {
 const g = +$('grade').value;
 $('gradeHelp').textContent = g <= 2 ? '저학년 · 큰 글씨, 짧은 문장과 친숙한 낱말의 예시' : g <= 4 ? '중학년 · 큰 글씨, 음식과 생활을 연결하는 예시' : '고학년 · 핵심 원리와 실천 이유를 생각하는 예시';
}
function wrap(text, width, size) {
 ctx.font = `500 ${size}px system-ui, sans-serif`;
 const lines = [];
 for (const paragraph of String(text).split('\n')) {
  let line = '';
  for (const ch of paragraph) { if (ctx.measureText(line + ch).width > width && line) { lines.push(line); line = ch; } else line += ch; }
  lines.push(line);
 }
 return lines;
}
function block(text, x, y, width, height, preferred, color = '#254b40') {
 let size = preferred, lines;
 do { lines = wrap(text,width,size); if(lines.length * size * 1.48 <= height) break; size--; } while(size > 18);
 ctx.font = `500 ${size}px system-ui, sans-serif`; ctx.fillStyle = color;
 lines.forEach((line,i) => ctx.fillText(line,x,y+i*size*1.48));
}
function rounded(x,y,w,h,r,fill) {ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function draw() {
 const s = state(), ready = started && !baseError(), g = +s.grade;
 const font = g <= 2 ? 36 : g <= 4 ? 33 : 30;
 ctx.clearRect(0,0,1600,900); ctx.fillStyle='#fffdf3';ctx.fillRect(0,0,1600,900);
 rounded(35,25,1530,215,28,'#e5efd7'); ctx.textBaseline='top';
 ctx.fillStyle='#4f7548';ctx.font='600 25px system-ui, sans-serif';ctx.fillText('구미봉곡초등학교 · 냠냠! 급식 탐험대',60,32);
 block(ready ? s.selected : '오늘은 어떤 음식을 만날까요?',60,85,1480,85,60,'#2d573c');
 ctx.fillStyle='#5e7751';ctx.font='500 27px system-ui, sans-serif';
 ctx.fillText(ready ? `${s.date.replaceAll('-','.')}  |  ${g}학년` : '왼쪽에서 날짜와 메뉴를 입력하고 작성을 시작하세요.',60,180);
 const xs=[45,560,1075], titles=['오늘의 음식 이야기','영양·식생활 정보','재미있는 퀴즈'];
 xs.forEach((x,i)=>{rounded(x,270,480,545,24,['#fff3d2','#eaf2df','#f0e9f8'][i]);ctx.fillStyle='#087e68';ctx.font='700 30px system-ui, sans-serif';ctx.fillText(`0${i+1}`,x+28,298);ctx.fillStyle='#183f33';ctx.font='700 32px system-ui, sans-serif';ctx.fillText(titles[i],x+28,342);});
 const confirmed = s.verified && s.nutrient.trim() && s.amount !== '' && Number.isFinite(+s.amount) && +s.amount >= 0 && +s.amount <= 100000 && s.basis.trim() && s.source.trim();
 const fact = confirmed ? `${s.nutrient} ${s.amount}${s.unit}\n기준: ${s.basis}\n출처: ${s.source}` : '정보 확인 필요\n검증한 영양성분 수치가 없습니다.';
 block(ready ? (s.story || '음식 이야기를 작성해 주세요.') : '음식에 담긴 이야기를 함께 알아봐요.',73,414,424,355,font);
 block(ready ? (s.nutrition || '영양·식생활 정보를 작성해 주세요.') : '골고루 먹는 즐거움을 배워요.',588,414,424,185,font);
 block(ready ? fact : '정보 확인 필요',588,634,424,152,confirmed?24:27,'#536f63');
 let quiz = ready && s.question ? s.question + '\n\n' + [0,1,2,3].map(i=>`${i+1}. ${s['option'+i]}`).join('\n') : '퀴즈를 작성하면 여기에 표시됩니다.';
 block(quiz,1103,414,424,showAnswer?285:350,font);
 if (showAnswer && ready && s.answer !== '') { rounded(1100,739,430,50,10,'#e2f4eb'); block(`정답: ${+s.answer+1}번`,1118,749,394,35,27,'#086a50'); }
 ctx.fillStyle='#536f63';ctx.font='500 23px system-ui, sans-serif';ctx.fillText('음식을 알고, 즐겁게 먹고, 건강하게 자라요.',60,853);
 canvas.setAttribute('aria-label',ready ? `${s.date}, ${g}학년, ${s.selected}. 음식 이야기: ${s.story}. 영양 정보: ${s.nutrition}. ${fact}. 퀴즈: ${quiz}${showAnswer && s.answer !== '' ? '. 정답 '+(+s.answer+1)+'번' : ''}` : '날짜와 메뉴를 입력하고 교육자료 작성을 시작하세요.');
 $('status').textContent = !ready ? '작성 전' : s.reviewed ? '교사 확인 완료' : '작성 중 · 확인 필요';
 renderStudent();
 $('toggleAnswer').textContent = showAnswer ? '정답 숨기기' : '정답 보기';$('toggleAnswer').setAttribute('aria-pressed',String(showAnswer));
}
$('editorForm').addEventListener('submit',e=>e.preventDefault());
$('editorForm').addEventListener('input', e => {
 if(!ids.includes(e.target.id) || e.target.id === 'selected') return;
 dirty=true;message('');
 if(e.target.id !== 'reviewed') $('reviewed').checked=false;
 if(['nutrient','amount','unit','basis','source'].includes(e.target.id)) $('verified').checked=false;
 if(e.target.id==='menus') syncMenus();
 if(e.target.id==='grade') gradeInfo();
 draw();
});
$('prepare').onclick=()=>{const b=baseError();if(b)return error(...b);started=true;$('content').disabled=false;draw();message('작성을 시작합니다. 내용을 입력하거나 학년별 예시를 적용하세요.',true);};
const examples = {
 balanced: [
 ['여러 가지 음식을 만나 보아요. 색과 냄새가 어떻게 다른지 살펴보고 천천히 맛보세요.','음식마다 우리 몸을 돕는 일이 달라요. 여러 가지 음식을 골고루 먹어요.','식사할 때 어떤 방법이 좋을까요?',['한 가지만 먹기','여러 음식을 골고루 먹기','식사를 거르기','서둘러 삼키기'],1],
 ['오늘 메뉴에는 어떤 재료가 들어 있을까요? 곡류, 채소, 콩이나 고기처럼 서로 다른 재료를 찾아보세요.','우리 몸에는 다양한 영양소가 필요해요. 여러 식품을 골고루 먹는 습관이 균형 잡힌 식사에 도움이 됩니다.','균형 잡힌 식사를 위한 습관은 무엇일까요?',['좋아하는 음식만 먹기','매일 같은 반찬만 먹기','다양한 식품을 골고루 먹기','물을 마시지 않기'],2],
 ['하나의 음식에도 여러 재료가 들어갈 수 있어요. 오늘 메뉴의 재료를 살펴보고 식사의 다양성을 생각해 봅시다.','식품마다 들어 있는 영양소의 종류와 양은 달라요. 특정 식품에만 의존하지 않고 다양한 식품을 선택하는 것이 좋습니다.','다양한 식품을 먹는 이유로 알맞은 것은?',['모든 식품의 영양소가 같아서','필요한 영양소를 다양하게 얻기 위해','한 음식이 모든 영양소를 충분히 줘서','식사 속도를 높이기 위해'],1]
 ],
 vegetable: [
 ['채소는 색도 모양도 달라요. 오늘 메뉴에서 채소를 찾아보세요. 먹기 어렵다면 선생님과 이야기해요.','채소는 식이섬유를 얻는 데 도움이 돼요. 다양한 채소와 친해져 보세요.','채소와 친해지는 방법은?',['친구에게 억지로 먹이기','색과 모양부터 살펴보기','항상 피하기','음식으로 장난치기'],1],
 ['같은 채소도 익히거나 써는 방법에 따라 식감이 달라집니다. 오늘 메뉴에 담긴 채소의 특징을 관찰해 보세요.','채소에는 식이섬유와 여러 비타민, 무기질이 들어 있어요. 한 가지에 치우치지 않고 다양하게 먹어 봅시다.','같은 채소의 식감이 달라질 수 있는 이유는?',['조리 방법이 달라서','그릇 이름이 달라서','요일이 달라서','식탁 번호가 달라서'],0],
 ['채소를 생으로 먹을 때와 익혀 먹을 때의 맛과 질감은 어떻게 다를까요? 오늘의 조리 방법을 찾아봅시다.','채소의 종류와 조리 방법에 따라 영양소 함량도 달라질 수 있어요. 정확한 수치는 음식과 기준량이 일치하는 자료로 확인합니다.','영양성분 수치를 비교할 때 확인할 것은?',['사진 색깔만','음식 이름과 기준량','접시 가격만','식당의 크기만'],1]
 ],
 waste: [
 ['급식 한 끼에는 많은 사람의 손길이 담겨 있어요. 음식을 준비해 준 분들께 감사하는 마음을 가져요.','먹을 만큼 받고 천천히 먹어요. 양 조절이 필요하면 선생님께 도움을 요청해요.','음식을 소중히 여기는 방법은?',['남길 만큼 많이 받기','바닥에 버리기','먹을 만큼 받기','친구에게 억지로 먹이기'],2],
 ['음식이 우리 식탁에 오기까지 농사, 운반, 조리의 과정을 거칩니다. 한 끼에 담긴 수고를 생각해 봅시다.','알맞은 양을 받고 부족하면 더 요청해요. 무조건 다 먹기보다 몸의 신호와 학교의 배식 안내를 함께 살펴요.','음식물 쓰레기를 줄이는 실천은?',['처음부터 지나치게 많이 받기','필요한 양을 요청하기','반찬을 숨겨 버리기','친구 식사를 재촉하기'],1],
 ['식재료를 생산하고 운반하고 조리하는 데에는 자원이 쓰입니다. 급식에서 실천할 수 있는 낭비 줄이기를 찾아봅시다.','음식을 소중히 여기면서 자신의 필요에 맞게 먹는 것이 중요해요. 섭취량을 억지로 늘리기보다 적정 배식과 추가 배식을 활용해요.','건강과 음식 낭비를 함께 고려한 행동은?',['배불러도 억지로 먹기','음식을 몰래 버리기','필요한 양을 받고 부족하면 더 요청하기','식사를 거르기'],2]
 ]
};
$('applyExample').onclick=()=>{
 if(!started || baseError())return error('날짜와 메뉴를 입력한 뒤 작성을 시작해 주세요.','prepare');
 if(($('story').value || $('nutrition').value || $('question').value) && !confirm('현재 교육 내용을 선택한 예시로 바꿀까요? 검증한 영양성분 자료도 초기화됩니다.'))return;
 const e=examples[$('example').value][Math.floor((+$('grade').value-1)/2)];
 $('story').value=e[0];$('nutrition').value=e[1];$('question').value=e[2];e[3].forEach((v,i)=>$('option'+i).value=v);$('answer').value=String(e[4]);
 ['nutrient','amount','basis','source'].forEach(id=>$(id).value='');$('verified').checked=false;$('reviewed').checked=false;dirty=true;draw();message('예시를 적용했습니다. 메뉴와 내용이 어울리는지 직접 확인해 주세요.',true);
};
function download(blob,name) {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('saveJson').onclick=()=>{if(!valid())return;download(new Blob([JSON.stringify({version:1,data:state()},null,2)],{type:'application/json'}),`nutrition-${$('date').value}.json`);message('JSON 파일을 내려받았습니다. 실제 다운로드 완료를 확인하세요. 이후 수정 내용은 다시 저장해야 합니다.',true);};
$('loadJson').onclick=()=>$('file').click();
function parseDocument(raw) {
 if(!raw || raw.version!==1 || !raw.data || typeof raw.data!=='object' || Array.isArray(raw.data))throw Error('지원하지 않는 JSON 형식입니다.');
 const d=raw.data, limits={date:10,grade:1,menus:700,selected:45,story:180,nutrition:180,nutrient:20,amount:30,unit:4,basis:30,source:70,question:90,option0:40,option1:40,option2:40,option3:40,answer:1};
 for(const id of ids){if(['verified','reviewed'].includes(id)){if(typeof d[id]!=='boolean')throw Error('확인 항목 형식이 잘못되었습니다.');}else if(typeof d[id]!=='string'||d[id].length>limits[id])throw Error('누락되거나 너무 긴 항목이 있습니다.');}
 const date=new Date(d.date+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==d.date)throw Error('급식 날짜가 잘못되었습니다.');
 if(!['1','2','3','4','5','6'].includes(d.grade)||!['g','mg','μg','kcal','%'].includes(d.unit)||!['','0','1','2','3'].includes(d.answer))throw Error('선택 항목이 잘못되었습니다.');
 if(!d.selected || !d.menus.split('\n').map(x=>x.trim()).includes(d.selected))throw Error('소개 메뉴가 메뉴 목록에 없습니다.');
 if(d.amount!=='' && (!/^\d+(\.\d+)?$/.test(d.amount)||+d.amount>100000))throw Error('영양성분 수치가 잘못되었습니다.');
 const quiz=d.question || [0,1,2,3].some(i=>d['option'+i]) || d.answer!=='';
 if(quiz && (!d.question.trim() || d.answer==='' || [0,1,2,3].some(i=>!d['option'+i].trim())))throw Error('퀴즈 질문·보기·정답이 완전하지 않습니다.');
 if(/\d/.test(d.nutrition))throw Error('영양 정보의 수치는 검증 자료 항목에 입력해야 합니다.');
 return d;
}
$('file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>100000)throw Error('파일 크기는 100KB 이하여야 합니다.');const d=parseDocument(JSON.parse(await file.text()));if(dirty&&!confirm('현재 내용을 불러온 자료로 교체할까요? 보관하려면 먼저 JSON을 저장하세요.'))return;
 ids.filter(id=>id!=='selected').forEach(id=>{if($(id).type==='checkbox')$(id).checked=d[id];else $(id).value=d[id];});syncMenus();$('selected').value=d.selected;started=true;$('content').disabled=false;dirty=true;showAnswer=false;gradeInfo();draw();message('자료를 복원했습니다. 사용 전 내용을 다시 살펴보세요.',true);
 }catch(err){message('불러오기 실패: '+err.message+' 기존 작성 내용은 유지됩니다.');}};
$('toggleAnswer').onclick=()=>{showAnswer=!showAnswer;draw();};
$('saveImage').onclick=()=>{if(!valid(true))return;draw();canvas.toBlob(blob=>{if(!blob)return error('이미지를 만들지 못했습니다. 다시 시도해 주세요.');download(blob,`nutrition-${$('date').value}.png`);message('미리보기와 동일한 PNG를 내려받았습니다.',true);},'image/png');};
$('print').onclick=()=>{if(!valid(true))return;draw();const image=new Image();image.alt='영양교육 자료';image.onload=()=>{ $('printArea').replaceChildren(image);window.print();};image.src=canvas.toDataURL('image/png');};
$('fullscreen').onclick=async()=>{if(!valid(true))return;try{if(!$('tv').requestFullscreen)throw Error('이 브라우저는 전체화면을 지원하지 않습니다.');await $('tv').requestFullscreen();message('전체화면을 종료하려면 Esc 또는 닫기 버튼을 누르세요.',true);}catch(e){message('전체화면을 열지 못했습니다. '+e.message);}};
$('exitFullscreen').onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

// Interactive meal explorer. Only teacher-approved custom text is shown to pupils.
const contentKeys = ['story','nutrition','nutrient','amount','unit','basis','source','verified','question','option0','option1','option2','option3','answer','reviewed'];
let menuDrafts = Object.create(null), editingMenu = '', mealOrigin = 'demo', activeFood = '', activeTab = 'story', quizChoice = null;
let officialAllergens = Object.create(null), mealRequest = 0;
function node(tag, className, text) {const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function action(text, className, callback) {const b=node('button',className,text);b.type='button';b.onclick=callback;return b;}
const artParts = {
 meat:'<ellipse cx="80" cy="112" rx="59" ry="18" fill="#d1dfbd"/><path d="M99 88l25 22q11-4 13 5 1 9-10 10-2 9-11 6-7-3-5-12L87 99Z" fill="#fff6da" stroke="#c3b18c" stroke-width="3"/><path d="M51 36q31-19 53 6 22 28-6 53-20 23-45 9-31-19-20-44Z" fill="#e7ac72" stroke="#b38456" stroke-width="3"/><path d="M49 58q2-11 15-15" fill="none" stroke="#ffe0a7" stroke-width="6" stroke-linecap="round"/>',
 rice:'<ellipse cx="80" cy="65" rx="48" ry="28" fill="#fffdf2" stroke="#d7d3bc" stroke-width="3"/><path d="M34 68 Q37 122 80 122 Q123 122 126 68Z" fill="#b6d5ad" stroke="#718a5e" stroke-width="3"/><path d="M52 47l5-5m15 2 3-6m15 8 5-4m12 12 5-2m-47 1 5-3" stroke="#e5dfc8" stroke-width="3" stroke-linecap="round"/>',
 doraji:'<path d="M80 49 Q54 23 45 39 Q49 59 76 61 M84 52 Q94 20 112 27 Q118 45 87 61" fill="#91b06e" stroke="#5f8452" stroke-width="3"/><path d="M76 51 Q49 62 55 92 Q59 110 45 124 Q65 119 75 99 Q80 128 94 132 Q90 104 101 88 Q106 60 85 52Z" fill="#fff5dc" stroke="#b5a77c" stroke-width="3"/><path d="M80 60L80 84m-18-9 8 2m22 17-6 2" stroke="#d5c5a0" stroke-width="3"/><path d="M78 27 Q62 17 65 4 Q79 0 85 15 Q95 1 107 10 Q111 23 94 29 Q99 43 85 46 Q74 43 78 27Z" fill="#bfafe0" stroke="#9581b3" stroke-width="2"/>',
 soup:'<ellipse cx="80" cy="67" rx="51" ry="24" fill="#d6b576" stroke="#b38c52" stroke-width="3"/><path d="M30 67Q31 120 80 123Q129 120 130 67Z" fill="#f1ac89" stroke="#bc7f63" stroke-width="3"/><path d="M42 64l18-9 15 11-12 10Z" fill="#fff1c6"/><path d="M85 56l15-4 11 12-17 7Z" fill="#8ba968"/><path d="M60 28q-10-10 0-20m24 21q10-10 0-20m22 23q-10-10 0-20" fill="none" stroke="#cabd9e" stroke-width="4" stroke-linecap="round"/>',
 fruit:'<path d="M79 48Q51 28 33 53Q13 86 47 117Q67 130 81 116Q100 130 121 105Q147 70 119 47Q100 35 86 48Z" fill="#ef9d82" stroke="#b97562" stroke-width="3"/><path d="M81 46Q76 26 84 18" fill="none" stroke="#917452" stroke-width="6" stroke-linecap="round"/><path d="M87 29Q92 4 119 15Q116 37 87 29" fill="#96b377" stroke="#6a8f57" stroke-width="3"/><path d="M47 60q-10 8-9 20" fill="none" stroke="#ffd2b8" stroke-width="6" stroke-linecap="round"/>',
 vegetable:'<path d="M75 60Q28 60 36 29Q57 15 75 41Q73 9 95 14Q117 25 96 48Q126 26 137 49Q139 77 98 71Z" fill="#9fbe77" stroke="#6f975b" stroke-width="3"/><path d="M69 58Q114 54 103 84L60 131Q48 141 46 123Z" fill="#efb275" stroke="#c18d59" stroke-width="3"/><path d="M70 78l10 5m-19 9 10 5m-17 10 9 5" stroke="#cc8e52" stroke-width="4" stroke-linecap="round"/>',
 kimchi:'<path d="M40 112Q38 84 58 39L77 27L111 37Q123 85 116 116Z" fill="#e1bd77" stroke="#ac8d55" stroke-width="3"/><path d="M52 111Q47 83 64 46M69 116Q65 75 81 39M87 116Q91 76 96 44M104 113Q108 79 107 53" stroke="#e98f69" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M62 48l-5-15m20 7 3-16m19 17 5-15" stroke="#96ad6b" stroke-width="9" stroke-linecap="round"/>',
 protein:'<ellipse cx="80" cy="98" rx="59" ry="30" fill="#d1dfbd" stroke="#a0b582" stroke-width="3"/><path d="M37 87l26-40 56 9 10 39-61 18Z" fill="#fff3ce" stroke="#c4ac7b" stroke-width="3"/><path d="M63 47l5 66m-31-26 57-15 35 23" fill="none" stroke="#dfc899" stroke-width="3"/><path d="M49 71l5-1m37 26 5-1m9-30 5 1" stroke="#d4bb8b" stroke-width="3"/>',
 generic:'<ellipse cx="80" cy="91" rx="59" ry="35" fill="#e6dca8" stroke="#bfb47b" stroke-width="3"/><ellipse cx="80" cy="86" rx="47" ry="24" fill="#fff9e7"/><path d="M55 88Q47 58 69 53Q82 46 88 65Q110 47 115 69Q117 93 91 97Z" fill="#a8bd80" stroke="#7d9c5d" stroke-width="3"/><circle cx="60" cy="90" r="12" fill="#eaa784"/>'
};
function foodType(name) {if(/도라지/.test(name))return 'doraji';if(/밥|쌀|보리|현미|기장/.test(name))return 'rice';if(/국|탕|찌개|스프|수프/.test(name))return 'soup';if(/김치|깍두기/.test(name))return 'kimchi';if(/사과|배$|귤|감귤|과일|포도|바나나|딸기|멜론|수박|복숭아|오렌지/.test(name))return 'fruit';if(/고기|닭|돈|돼지|쇠|소고기|오리|너겟/.test(name))return 'meat';if(/두부|콩|계란|달걀|생선|고등어/.test(name))return 'protein';if(/무침|채소|나물|샐러드|당근|오이|시금치|브로콜리/.test(name))return 'vegetable';return 'generic';}
function foodArt(type) {const div=node('div');div.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 150" aria-hidden="true">'+artParts[type]+'<ellipse cx="67" cy="87" rx="3" ry="4" fill="#4c523a"/><ellipse cx="92" cy="87" rx="3" ry="4" fill="#4c523a"/><path d="M74 97q6 7 12 0" fill="none" stroke="#4c523a" stroke-width="3" stroke-linecap="round"/><ellipse cx="58" cy="95" rx="6" ry="3" fill="#e9a190" opacity=".7"/><ellipse cx="102" cy="95" rx="6" ry="3" fill="#e9a190" opacity=".7"/></svg>';return div.firstElementChild;}
// Built-in qualitative learning cards. No nutrition quantities are inferred from dish names.
function foodLesson(name) {
 const type=foodType(name), low=+$('grade').value<=2;
 const lessons={
 meat:{title:'고기 반찬도 골고루 함께!',story:'고기 반찬은 굽거나 볶거나 삶는 등 여러 방법으로 만들어요. 오늘 메뉴는 어떤 방법으로 만들었을까요? 함께 들어간 채소도 찾아보세요.',nutrition:'고기는 단백질을 얻는 식품 중 하나예요. 단백질은 우리 몸을 구성하는 데 필요해요. 밥과 채소 등 다른 음식도 함께 골고루 먹어요.',question:'고기 반찬을 먹을 때 좋은 방법은?',options:['고기만 골라 먹기','채소는 모두 남기기','밥과 채소도 골고루 함께 먹기','씹지 않고 삼키기'],answer:2,explanation:'밥, 고기, 채소처럼 다양한 음식을 골고루 먹어요.'},
 rice:{title:'작은 쌀알의 든든한 변신!',story:low?'쌀을 씻고 물을 넣어 지으면 보슬보슬 밥이 돼요. 꼭꼭 씹으면 어떤 맛이 나는지 느껴 보세요.':'밥의 주재료인 쌀은 논에서 자라요. 수확한 벼를 도정한 쌀에 물을 넣고 가열하면 우리가 먹는 밥이 됩니다.',nutrition:'밥은 탄수화물을 얻는 식품이에요. 탄수화물은 우리 몸이 움직이는 데 필요한 에너지를 내는 데 쓰여요.',question:'우리가 먹는 쌀은 어디에서 자랄까요?',options:['바다 속','논','나무 꼭대기','모래성'],answer:1,explanation:'쌀은 논에서 기른 벼에서 얻어요. 농부의 수고도 함께 기억해요.'},
 doraji:{title:'땅속에서 자라는 도라지 친구',story:low?'도라지는 땅속에서 자라는 뿌리채소예요. 하얗고 길쭉한 뿌리를 먹어요. 꽃도 예쁘게 피어요.':'도라지는 꽃이 피는 식물이에요. 우리가 반찬으로 먹는 부분은 땅속의 뿌리랍니다. 무침이나 나물로 만나 볼 수 있어요.',nutrition:'도라지 같은 채소는 식이섬유를 얻는 데 도움이 돼요. 도라지를 먹는다고 병이 치료되는 것은 아니에요.',question:'도라지 반찬은 주로 어느 부분으로 만들까요?',options:['꽃잎','씨앗','뿌리','나무껍질'],answer:2,explanation:'도라지의 뿌리를 먹어요! 도라지초무침은 뿌리를 손질해 양념한 음식이에요.'},
 soup:{title:'보글보글, 국 속에는 뭐가 있을까?',story:'국과 찌개에는 여러 가지 재료가 어우러져요. 오늘 국에서 어떤 재료를 찾을 수 있나요? 뜨거울 수 있으니 천천히 먹어요.',nutrition:'국의 영양은 들어간 재료에 따라 달라요. 국물만 먹기보다 건더기도 함께 살펴보세요. 정확한 수치는 조리 자료로 확인해요.',question:'뜨거운 국을 먹을 때 어떻게 할까요?',options:['천천히 식혀서 먹기','급하게 삼키기','친구에게 장난치기','뛰어다니며 먹기'],answer:0,explanation:'뜨거운 국은 식혀서 천천히 먹어요. 먹는 동안 장난치지 않아요.'},
 kimchi:{title:'시간이 만드는 김치의 맛',story:'김치는 채소에 양념을 더해 만드는 음식이에요. 발효가 진행되면 맛과 향이 달라져요. 배추김치, 깍두기 등 종류도 다양해요.',nutrition:'김치도 채소로 만든 음식이에요. 김치만 먹기보다 다양한 채소 반찬과 함께 골고루 먹어요.',question:'깍두기의 주재료는 무엇일까요?',options:['쌀','사과','콩','무'],answer:3,explanation:'깍두기는 무를 썰어 만들어요. 김치마다 어떤 채소가 쓰이는지 찾아보세요.'},
 fruit:{title:'색도 향도 다른 과일 친구들',story:'과일은 종류마다 색과 향, 맛이 달라요. 오늘 과일의 껍질과 속을 관찰하고 어떤 향이 나는지 느껴 보세요.',nutrition:'과일은 비타민과 식이섬유 등을 얻는 데 도움이 돼요. 과일마다 들어 있는 영양소와 양이 달라요.',question:'과일을 먹기 전 알맞은 행동은?',options:['손을 씻기','바닥에 굴리기','친구 것을 빼앗기','씻지 않은 손으로 만지기'],answer:0,explanation:'깨끗하게 손을 씻고 먹어요. 껍질이나 씨는 선생님의 안내에 따라 처리해요.'},
 vegetable:{title:'알록달록 채소 관찰 시간',story:'채소는 잎, 줄기, 뿌리 등 먹는 부분이 다양해요. 오늘 반찬의 채소는 어떤 색인가요? 재료와 식감을 살펴보세요.',nutrition:'채소에는 식이섬유와 여러 비타민, 무기질이 들어 있어요. 종류에 따라 다르니 다양한 채소와 친해져요.',question:'채소와 친해지는 좋은 방법은?',options:['친구에게 억지로 먹이기','색과 모양을 살펴보기','음식으로 장난치기','이름도 알아보지 않기'],answer:1,explanation:'색과 모양을 관찰하며 천천히 친해져요. 먹기 어렵다면 선생님과 이야기해요.'},
 protein:{title:'어떤 재료로 만든 음식일까?',story:'오늘 메뉴에는 어떤 재료가 들어 있을까요? 이름에서 힌트를 찾아보세요. 정확한 재료는 선생님께 물어볼 수 있어요.',nutrition:'콩, 두부, 고기, 달걀, 생선 등은 단백질을 얻는 식품이에요. 실제 메뉴의 영양은 재료와 조리 방법에 따라 달라요.',question:'두부의 주재료는 무엇일까요?',options:['사과','무','콩','쌀'],answer:2,explanation:'두부는 콩으로 만드는 식품이에요. 같은 콩도 다양한 음식으로 변신해요.'},
 generic:{title:'한 입에 담긴 음식 이야기',story:'오늘 메뉴에는 어떤 재료가 들어 있을까요? 색, 냄새, 모양을 천천히 관찰해 보세요. 모르는 재료는 선생님께 물어봐요.',nutrition:'음식마다 들어 있는 영양소가 달라요. 다양한 식품을 골고루 먹는 습관을 길러요. 이 메뉴의 정확한 영양 수치는 확인이 필요해요.',question:'식사할 때 좋은 습관은 무엇일까요?',options:['음식으로 장난치기','빨리 삼키기','한 가지만 먹기','여러 음식을 골고루 먹기'],answer:3,explanation:'여러 음식을 골고루 먹고, 식사는 천천히 즐겨요.'}
 };
 return {...lessons[type],type};
}
function saveMenuDraft() {if(editingMenu)menuDrafts[editingMenu]=Object.fromEntries(contentKeys.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]));}
function selectEditorMenu(name) {
 editingMenu=name;
 const saved=menuDrafts[name], lesson=foodLesson(name);
 const d=saved || {story:lesson.story,nutrition:lesson.nutrition,question:lesson.question,option0:lesson.options[0],option1:lesson.options[1],option2:lesson.options[2],option3:lesson.options[3],answer:String(lesson.answer),unit:'g'};
 contentKeys.forEach(id=>{if($(id).type==='checkbox')$(id).checked=!!d[id];else $(id).value=d[id]??'';});
 if(name){started=true;$('content').disabled=false;}else {$('content').disabled=true;started=false;}
 draw();
}
$('selected').addEventListener('input',()=>{dirty=true;saveMenuDraft();selectEditorMenu($('selected').value);});
$('menus').addEventListener('input',()=>{saveMenuDraft();mealOrigin='manual';officialAllergens=Object.create(null);$('mealStatus').textContent='현재 메뉴는 직접 입력한 내용입니다. 학교의 실제 식단과 대조해 주세요.';if(!menuList().includes(editingMenu)){editingMenu='';$('selected').value='';}renderStudent();});
function studentLesson(name, preview = false) {
 const d=name===editingMenu?Object.fromEntries(contentKeys.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value])):menuDrafts[name];
 const preset=foodLesson(name);
 if((d?.reviewed || preview) && d?.story?.trim() && d.nutrition?.trim() && d.question?.trim() && ['0','1','2','3'].includes(d.answer) && [0,1,2,3].every(i=>d['option'+i]?.trim()) && !/\d/.test(d.nutrition)){
 const confirmed=d.verified&&d.nutrient?.trim()&&d.amount!==''&&Number.isFinite(+d.amount)&&+d.amount>=0&&+d.amount<=100000&&d.basis?.trim()&&d.source?.trim();
 return {...preset,story:d.story,nutrition:d.nutrition,question:d.question,options:[0,1,2,3].map(i=>d['option'+i]),answer:+d.answer,explanation:`정답은 ${+d.answer+1}번, ‘${d['option'+d.answer]}’이에요.`,custom:true,reviewed:!!d.reviewed,fact:confirmed?`${d.nutrient} ${d.amount}${d.unit} · ${d.basis}\n출처: ${d.source}`:null};
 }
 return preset;
}
function sourceLabel(){return mealOrigin==='official'?'나이스 공식 식단':mealOrigin==='demo'?'체험 메뉴 · 실제 식단 아님':'직접 입력 · 교사 확인 필요';}
function menuHome() {
 const outer=node('div'),home=node('div','explore-home'),heading=node('div','explore-heading'),text=node('div');
 text.append(node('span','lunch-label','LET’S EAT & LEARN'),node('h2','', '오늘의 급식 탐험대'));
 const h=text.querySelector('h2');h.replaceChildren(document.createTextNode('맛있게 먹고, '),node('em','', '똑똑하게!'));
 text.append(node('p','', '오늘 만날 음식 친구를 콕! 눌러 보세요.'));
 const mascot=node('div','food-mascot');mascot.append(foodArt('rice'));heading.append(text,mascot);
 const date=node('div','meal-date');date.append(node('strong','',$('date').value?$('date').value.replaceAll('-','. '):'날짜를 선택해 주세요'),node('span','',`${$('grade').value}학년과 함께`),node('span','source-badge',sourceLabel()));
 home.append(heading,date);
 const list=menuList();
 if(list.length){const tray=node('div','food-tray');list.forEach(name=>{const b=action('', 'food-tile',()=>{activeFood=name;activeTab='story';quizChoice=null;renderStudent();});b.setAttribute('aria-label',name+' 알아보기');b.append(foodArt(foodType(name)),node('strong','',name),node('span','','콕! 눌러 탐험하기 ↗'));tray.append(b);});home.append(tray,node('p','touch-hint'));home.lastChild.append(node('span','','☝'),document.createTextNode('음식 이야기부터 퀴즈까지, 직접 만져 보세요!'));}
 else {const empty=node('div','empty-meal');empty.append(node('span','','🍽️'),node('p','','선생님이 오늘의 급식을 준비하고 있어요.'));home.append(empty);}
 outer.append(home,node('div','explore-footer','먹기 전 알레르기 정보는 학교 급식 안내를 확인해 주세요. · 음식 그림은 이해를 돕는 일러스트예요.'));return outer;
}
function menuDetail(preview = false) {
 const name=activeFood,lesson=studentLesson(name,preview),detail=node('div','food-detail'),top=node('div','detail-top');
 top.append(action('← 오늘의 식판','back-food',()=>{activeFood='';quizChoice=null;renderStudent();}),node('span','lunch-label',lesson.custom?(lesson.reviewed?'선생님이 준비한 이야기':'편집 미리보기 · 확인 전'):'음식 탐험 카드'));
 const title=node('div','detail-title'),art=node('div','detail-art'),label=node('div');art.append(foodArt(lesson.type));label.append(node('span','eyebrow','오늘의 음식 친구'),node('h2','',name),node('p','',lesson.title));title.append(art,label);
 const tabs=node('div','detail-tabs');tabs.setAttribute('role','tablist');[['story','📖 음식 이야기'],['nutrition','🌱 영양 알아보기'],['quiz','✦ 퀴즈 풀기']].forEach(([id,text])=>{const b=action(text,'',()=>{activeTab=id;quizChoice=null;renderStudent();});b.setAttribute('role','tab');b.setAttribute('aria-selected',String(activeTab===id));tabs.append(b);});
 const card=node('div','learning-card');
 if(activeTab==='story'){card.append(node('h3','',lesson.title),node('p','',lesson.story));if(officialAllergens[name])card.append(node('p','fact-note','학교 원문 표기: '+officialAllergens[name]+'\n알레르기 번호의 뜻은 학교 급식 안내를 확인하세요.'));}
 if(activeTab==='nutrition')card.append(node('h3','','이 음식과 친해져요'),node('p','',lesson.nutrition),node('p','fact-note',lesson.fact||'영양성분 수치: 정보 확인 필요\n수치는 검증된 자료가 있을 때만 표시해요.'));
 if(activeTab==='quiz'){
 card.append(node('h3','',lesson.question));const options=node('div','quiz-options');
 lesson.options.forEach((option,i)=>{const b=action('','quiz-option',()=>{quizChoice=i;renderStudent();});b.setAttribute('aria-label',`${i+1}번 ${option}`);b.append(node('span','choice-index',String(i+1)),node('span','',option));if(quizChoice===i){b.classList.add(i===lesson.answer?'correct':'wrong');b.setAttribute('aria-pressed','true');}options.append(b);});card.append(options);
 const feedback=node('p','quiz-feedback',quizChoice===null?'정답이라고 생각하는 보기를 눌러 보세요.':quizChoice===lesson.answer?'🎉 정답! '+lesson.explanation:'🌱 괜찮아요! 다시 생각하고 다른 보기를 눌러 보세요.');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');card.append(feedback,action('↻ 처음부터 풀기','quiz-again',()=>{quizChoice=null;renderStudent();}));
 }
 detail.append(top,title,tabs,card);return detail;
}
function renderStudent(){if(!menuList().includes(activeFood))activeFood='';for(const id of ['studentPreview','stageContent']){const host=$(id);if(host)host.replaceChildren(activeFood?menuDetail(id==='studentPreview'):menuHome());}$('studentStage').classList.toggle('grade-small',+$('grade').value<=2);}
async function enterStandby(){saveMenuDraft();activeFood='';activeTab='story';quizChoice=null;renderStudent();$('studentStage').hidden=false;document.body.classList.add('in-standby');$('stageHome').focus();try{if($('studentStage').requestFullscreen)await $('studentStage').requestFullscreen();}catch(_){/* Touch mode remains usable when fullscreen is unavailable. */}}
$('standby').onclick=enterStandby;
$('stageHome').onclick=()=>{activeFood='';quizChoice=null;renderStudent();$('studentStage').scrollTop=0;};
$('stageFullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('studentStage').requestFullscreen)await $('studentStage').requestFullscreen();else alert('이 브라우저는 전체화면을 지원하지 않지만 터치 화면은 그대로 사용할 수 있어요.');}catch(_){alert('브라우저의 전체화면 허용 설정을 확인해 주세요.');}};
$('leaveStandby').onclick=async()=>{if(document.fullscreenElement)try{await document.exitFullscreen();}catch(_){}$('studentStage').hidden=true;document.body.classList.remove('in-standby');$('standby').focus();};
function todaySeoul(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());return ['year','month','day'].map(t=>parts.find(x=>x.type===t).value).join('-');}
function useDemo(){if(dirty&&!confirm('현재 메뉴를 체험 메뉴로 바꿀까요? 보관하려면 먼저 JSON을 저장하세요.'))return;menuDrafts=Object.create(null);officialAllergens=Object.create(null);mealOrigin='demo';$('menus').value='현미밥\n두부된장국\n도라지초무침\n닭살채소볶음\n배추김치\n사과';syncMenus();$('selected').value='현미밥';selectEditorMenu('현미밥');$('mealStatus').textContent='체험 메뉴입니다. 구미봉곡초등학교의 실제 급식이 아닙니다. 날짜를 선택하고 공식 급식을 불러오세요.';activeFood='';draw();}
$('demoMeals').onclick=()=>{useDemo();dirty=true;};
async function neis(endpoint,params,signal){const url=new URL('https://open.neis.go.kr/hub/'+endpoint);url.search=new URLSearchParams({Type:'json',pIndex:'1',pSize:'100',...params});const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('급식 서비스가 응답하지 않습니다.');const json=await response.json();const table=json[endpoint];if(!Array.isArray(table)){const code=json.RESULT?.CODE;if(code==='INFO-200')return [];throw Error('급식 서비스 접근이 제한되었거나 응답 형식이 다릅니다.');}const head=table.find(x=>x.head)?.head;const result=head?.find(x=>x.RESULT)?.RESULT;if(result&&result.CODE!=='INFO-000')throw Error(result.MESSAGE||'급식 조회 오류');return table.find(x=>Array.isArray(x.row))?.row||[];}
function cleanDish(raw){return raw.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').trim();}
$('fetchMeals').onclick=async()=>{
 if(!$('date').value||!$('date').validity.valid)return error('급식 날짜를 먼저 선택해 주세요.','date');
 const date=$('date').value, token=++mealRequest,button=$('fetchMeals'),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);button.disabled=true;button.textContent='급식 찾는 중…';$('mealStatus').textContent='나이스에서 구미봉곡초등학교를 찾고 있어요.';
 try{
 const schools=await neis('schoolInfo',{SCHUL_NM:'구미봉곡초등학교'},controller.signal);
 const candidates=schools.filter(x=>x.SCHUL_NM==='구미봉곡초등학교'&&x.ATPT_OFCDC_SC_NM==='경상북도교육청'&&String(x.ORG_RDNMA||'').includes('구미'));
 if(candidates.length!==1)throw Error('공식 데이터에서 학교를 정확히 확인하지 못했습니다. 다른 학교의 메뉴를 대신 표시하지 않습니다.');
 const school=candidates[0],ymd=date.replaceAll('-','');
 const rows=await neis('mealServiceDietInfo',{ATPT_OFCDC_SC_CODE:school.ATPT_OFCDC_SC_CODE,SD_SCHUL_CODE:school.SD_SCHUL_CODE,MLSV_YMD:ymd,MMEAL_SC_CODE:'2'},controller.signal);
 const matches=rows.filter(x=>x.SCHUL_NM==='구미봉곡초등학교'&&x.MLSV_YMD===ymd&&String(x.MMEAL_SC_CODE)==='2'&&String(x.SD_SCHUL_CODE)===String(school.SD_SCHUL_CODE));
 if(!matches.length)throw Error('선택한 날짜의 중식 정보가 없습니다. 주말·공휴일이거나 아직 등록되지 않았을 수 있어요. 기존 메뉴는 유지합니다.');
 const raw=cleanDish(matches.map(x=>x.DDISH_NM||'').join('\n')).split('\n').map(x=>x.trim()).filter(Boolean),allergies=Object.create(null);
 const names=[...new Set(raw.map(x=>{const name=x.replace(/\s*\([\d.\s]+\)/g,'').replace(/^[*•\s]+/,'').trim();allergies[name]=x;return name;}))];
 if(!names.length||names.some(x=>x.length>45)||names.join('\n').length>700)throw Error('식단 형식을 확인할 수 없습니다. 학교 안내와 대조해 직접 입력해 주세요.');
 if(token!==mealRequest||$('date').value!==date)throw Error('선택 날짜가 바뀌었습니다. 다시 불러와 주세요.');
 if(dirty&&!confirm('현재 메뉴와 메뉴별 편집 내용을 공식 식단으로 바꿀까요? 필요하면 먼저 JSON을 저장하세요.')){$('mealStatus').textContent='불러오기를 취소했습니다. 기존 메뉴를 유지합니다.';return;}
 menuDrafts=Object.create(null);officialAllergens=allergies;mealOrigin='official';$('menus').value=names.join('\n');syncMenus();$('selected').value=names[0];selectEditorMenu(names[0]);activeFood='';dirty=true;draw();$('mealStatus').textContent=`${date} 구미봉곡초등학교 중식 ${names.length}개 메뉴를 나이스에서 불러왔습니다. 학교 안내와 최종 대조해 주세요.`;
 }catch(e){$('mealStatus').textContent=e.name==='AbortError'?'급식 조회 시간이 초과되었습니다. 기존 메뉴를 유지합니다. 직접 입력하거나 다시 시도해 주세요.':'불러오기 실패: '+(e instanceof TypeError?'네트워크·학교 API 연결을 확인해 주세요. 기존 메뉴를 유지합니다.':e.message);}
 finally{clearTimeout(timeout);button.disabled=false;button.textContent='↻ 선택 날짜 급식 불러오기';}
};
// Version 2 includes the per-menu drafts. Version 1 files remain supported.
$('saveJson').onclick=()=>{if(!valid())return;saveMenuDraft();const data=state(),drafts=Object.fromEntries(menuList().filter(name=>menuDrafts[name]).map(name=>[name,menuDrafts[name]]));try{for(const [name,draft] of Object.entries(drafts))parseDocument({version:1,data:{...data,...draft,selected:name}});}catch(e){return error('메뉴별 자료를 확인해 주세요. '+e.message+' 메뉴를 선택해 수정한 뒤 저장하세요.','selected');}download(new Blob([JSON.stringify({version:2,data,drafts},null,2)],{type:'application/json'}),`nutrition-${data.date}.json`);message('메뉴별 자료를 JSON으로 내려받았습니다. 파일의 다운로드 완료를 확인하세요.',true);};
$('file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{
 if(file.size>100000)throw Error('파일 크기는 100KB 이하여야 합니다.');const raw=JSON.parse(await file.text());if(![1,2].includes(raw?.version))throw Error('지원하지 않는 JSON 버전입니다.');const d=parseDocument({version:1,data:raw.data}),drafts=Object.create(null);
 if(raw.version===2){if(!raw.drafts||typeof raw.drafts!=='object'||Array.isArray(raw.drafts))throw Error('메뉴별 자료 형식이 잘못되었습니다.');for(const [name,entry] of Object.entries(raw.drafts)){if(!d.menus.split('\n').map(x=>x.trim()).includes(name)||!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('메뉴별 자료가 식단과 맞지 않습니다.');const checked=parseDocument({version:1,data:{...d,...entry,selected:name}});drafts[name]=Object.fromEntries(contentKeys.map(k=>[k,checked[k]]));}}
 if(dirty&&!confirm('현재 내용을 불러온 자료로 교체할까요? 보관하려면 먼저 JSON을 저장하세요.'))return;
 ids.filter(id=>id!=='selected').forEach(id=>{if($(id).type==='checkbox')$(id).checked=d[id];else $(id).value=d[id];});syncMenus();$('selected').value=d.selected;menuDrafts=drafts;editingMenu=d.selected;saveMenuDraft();mealOrigin='manual';officialAllergens=Object.create(null);started=true;$('content').disabled=false;dirty=true;showAnswer=false;activeFood='';quizChoice=null;gradeInfo();draw();$('mealStatus').textContent='JSON에서 복원한 메뉴입니다. 실제 학교 식단과 확인하세요.';message('메뉴별 자료를 복원했습니다. 사용 전 내용을 다시 확인하세요.',true);
 }catch(err){message('불러오기 실패: '+err.message+' 기존 작성 내용은 유지됩니다.');}};
$('date').addEventListener('input',()=>{if(mealOrigin==='official'){mealOrigin='manual';$('mealStatus').textContent='날짜가 바뀌었습니다. 해당 날짜의 급식을 다시 불러오세요.';renderStudent();}});
$('date').value=todaySeoul();gradeInfo();useDemo();dirty=false;
