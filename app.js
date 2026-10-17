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
 ctx.clearRect(0,0,1600,900); ctx.fillStyle='#f0f8f4';ctx.fillRect(0,0,1600,900);
 rounded(0,0,1600,230,0,'#087e68'); ctx.textBaseline='top';
 ctx.fillStyle='#c9eee0';ctx.font='600 25px system-ui, sans-serif';ctx.fillText('우리 학교 · 오늘의 식생활 수업',60,32);
 block(ready ? s.selected : '오늘은 어떤 음식을 만날까요?',60,85,1480,85,60,'#ffffff');
 ctx.fillStyle='#e2f5ec';ctx.font='500 27px system-ui, sans-serif';
 ctx.fillText(ready ? `${s.date.replaceAll('-','.')}  |  ${g}학년` : '왼쪽에서 날짜와 메뉴를 입력하고 작성을 시작하세요.',60,180);
 const xs=[45,560,1075], titles=['오늘의 음식 이야기','영양·식생활 정보','재미있는 퀴즈'];
 xs.forEach((x,i)=>{rounded(x,270,480,545,20,'#ffffff');ctx.fillStyle='#087e68';ctx.font='700 30px system-ui, sans-serif';ctx.fillText(`0${i+1}`,x+28,298);ctx.fillStyle='#183f33';ctx.font='700 32px system-ui, sans-serif';ctx.fillText(titles[i],x+28,342);});
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
 $('toggleAnswer').textContent = showAnswer ? '정답 숨기기' : '정답 보기';$('toggleAnswer').setAttribute('aria-pressed',String(showAnswer));
}
$('editorForm').addEventListener('submit',e=>e.preventDefault());
$('editorForm').addEventListener('input', e => {
 if(!ids.includes(e.target.id)) return;
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
gradeInfo();draw();
