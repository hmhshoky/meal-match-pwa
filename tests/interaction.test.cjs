process.chdir(require('node:path').resolve(__dirname,'..'));
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const initialJsonHash=fs.existsSync('meal-match.json')?crypto.createHash('sha256').update(fs.readFileSync('meal-match.json')).digest('hex'):null;
const html=fs.readFileSync('index.html','utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(s=>s.trim()).join('\n');
new vm.Script(source);new vm.Script(fs.readFileSync('pwa.js','utf8'));new vm.Script(fs.readFileSync('sw.js','utf8'));
function app(){
  const nodes=new Map(),events={};
  const node=id=>{
    if(!nodes.has(id))nodes.set(id,{id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,dataset:{},open:false,scrollTop:0,classList:{add(){},remove(){},toggle(){}},focus(){},close(){this.open=false},showModal(){this.open=true},contains(){return false},addEventListener(){},querySelector(){return null}});
    return nodes.get(id);
  };
  const ctx=vm.createContext({URL,Blob,TextEncoder,console,setTimeout(){return 0},clearTimeout(){},CSS:{escape:s=>s},location:{hash:''},window:{addEventListener(){},scrollTo(){},confirm(){return true}},document:{activeElement:null,getElementById:node,querySelector:node,querySelectorAll(){return[]},addEventListener(type,fn){events[type]=fn}}});
  vm.runInContext(source,ctx);
  const run=s=>vm.runInContext(s,ctx);
  const click=(action,id,extra={})=>events.click({target:{closest(){return{dataset:{action,id,...extra},disabled:false}}}});
  const input=(id,value)=>{node(id).value=value;events.input({target:{id,value}})};
  const submit=id=>events.submit({target:{id},preventDefault(){}});
  const load=data=>{ctx.fixture=JSON.stringify(data);run('window.MealMatchFiles.importText(fixture,"handy-aktuell.json")')};
  const state=()=>JSON.parse(run('JSON.stringify(state)'));
  return {node,events,run,click,input,submit,load,state};
}
const fixture={format:'meal-match',schemaVersion:2,customField:{preserve:true},ingredients:[{id:'chicken',name:'Hähnchenbrust',category:'Fleisch & Fisch'},{id:'rice',name:'Reis',category:'Brot, Nudeln & Beilagen'},{id:'pepper',name:'Paprika',category:'Gemüse & Obst'},{id:'cheese',name:'Käse',category:'Milchprodukte & Eier'}],recipes:[{id:'bowl',name:'Chicken Bowl',items:[{ingredientId:'chicken',role:'required'},{ingredientId:'rice',role:'required'},{ingredientId:'pepper',role:'optional'}]},{id:'rice-pot',name:'Reistopf',items:[{ingredientId:'rice',role:'required'},{ingredientId:'cheese',role:'required'}]}],pantry:['rice','cheese'],plan:['bowl'],checked:['pepper']};
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('Syntax, empty start and existing JSON import',()=>{
 const a=app();assert(a.node('app').innerHTML.includes('meal-search'));assert.equal(a.state().recipes.length,0);
 a.load(fixture);assert.equal(a.state().recipes.length,fixture.recipes.length);
});
test('No duplicate recipe-open button or numeric percentage; bar and title remain',()=>{
 const a=app();a.load(fixture);const markup=a.run('renderMeals()');assert(!markup.includes('Rezept öffnen'));assert(!/\d+ %</.test(markup));assert(markup.includes('class="meter"'));assert(markup.includes('class="title-button"'));
});
test('Pantry has search/new button, no inline form, checkboxes, trash or arrow',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});const markup=a.node('app').innerHTML;
 assert(markup.includes('id="pantry-search"'));assert(markup.includes('data-action="new-ingredient"'));assert(!markup.includes('id="add-pantry-form"'));assert(!markup.includes('type="checkbox"'));assert(!markup.includes('data-action="delete-ingredient"'));assert(markup.includes('ingredient-menu'));assert(!markup.includes('M5 12h14m-5-5'));
});
test('Ingredient search supports umlauts, aliases, categories and no results',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});const before=a.state();
 for(const q of ['HÄHNCHEN','haehnchen','chicken breast','fleisch']){a.input('pantry-search',q);const markup=a.node('pantry-results').innerHTML;assert(markup.includes('data-pantry-row="chicken"'),q);assert(!markup.includes('data-pantry-row="rice"'),q)}
 a.input('pantry-search','unfindbar');assert(a.node('pantry-results').innerHTML.includes('Keine Zutaten'));a.click('reset-pantry-filters');assert(a.node('pantry-results').innerHTML.includes('data-pantry-row="rice"'));
 assert.deepEqual(a.state(),before);assert.equal(a.run('isDirty()'),false);
});
test('Tap row toggles stock, green class/pressed state, shopping and unsaved status',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});
 const before=a.state();a.click('toggle-pantry','pepper');assert(a.state().pantry.includes('pepper'));assert(!a.state().checked.includes('pepper'));assert(!a.run('getShopping().some(row=>row.id==="pepper")'));assert(a.node('app').innerHTML.includes('class="pantry-row available" data-pantry-row="pepper"'));assert.equal(a.run('isDirty()'),true);
 a.click('toggle-pantry','pepper');assert(!a.state().pantry.includes('pepper'));assert(a.run('getShopping().some(row=>row.id==="pepper")'));assert(a.node('app').innerHTML.includes('class="pantry-row " data-pantry-row="pepper"'));assert.deepEqual(a.state().recipes,before.recipes);
});
test('Availability filter combines with search, clears and survives stock changes',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});a.click('filter-pantry');a.input('pantry-search','reis');assert(a.node('pantry-results').innerHTML.includes('data-pantry-row="rice"'));a.click('toggle-pantry','rice');assert(!a.node('app').innerHTML.includes('data-pantry-row="rice"'));a.click('reset-pantry-filters');assert(a.node('app').innerHTML.includes('data-pantry-row="rice"'));
});
test('Menu opens ingredient dialog without toggling; recipe link switches tabs both ways',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});a.input('pantry-search','reis');const before=a.state();
 a.click('ingredient-detail','rice');assert.equal(a.node('modal').dataset.kind,'ingredient');assert.equal(a.run('ui.pantryQuery'),'reis');assert(a.node('modal').innerHTML.includes('data-action="ingredient-recipe"'));assert(a.node('modal').innerHTML.includes('data-action="delete-ingredient"'));assert.deepEqual(a.state(),before);
 a.click('ingredient-recipe','bowl');assert.equal(a.run('ui.tab'),'gerichte');assert.equal(a.node('modal').dataset.kind,'detail');assert.equal(a.run('ui.detailId'),'bowl');assert(!a.node('modal').innerHTML.includes('type="checkbox"'));assert(a.node('modal').innerHTML.includes('class="detail-row available"'));assert(a.node('modal').innerHTML.includes('class="detail-row "'));
 a.click('ingredient-detail','chicken');assert.equal(a.run('ui.tab'),'vorrat');assert.equal(a.node('modal').dataset.kind,'ingredient');assert.equal(a.run('ui.ingredientId'),'chicken');a.click('close-ingredient');assert.equal(a.run('ui.tab'),'vorrat');assert.equal(a.node('modal').open,false);assert.deepEqual(a.state(),before);assert.equal(a.run('isDirty()'),false);
});
test('New ingredient dialog: cancel is clean; valid category/name creates and closes',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});a.click('new-ingredient');assert.equal(a.node('modal').dataset.kind,'new-ingredient');assert(a.node('modal').innerHTML.includes('id="add-pantry-form"'));a.click('close-modal');assert.equal(a.run('isDirty()'),false);
 a.click('new-ingredient');a.node('add-pantry').value='Zucchini';a.node('ingredient-category').value='Gemüse & Obst';a.submit('add-pantry-form');
 const added=a.state().ingredients.find(i=>i.name==='Zucchini');assert(added);assert.equal(added.category,'Gemüse & Obst');assert(a.state().pantry.includes(added.id));assert.equal(a.node('modal').open,false);
});
test('Duplicate/new-category validation leaves state intact on errors',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});a.click('new-ingredient');const before=a.state();
 a.node('add-pantry').value='Reis';a.node('ingredient-category').value='Sonstiges';a.submit('add-pantry-form');assert(a.node('ingredient-add-error').textContent);assert.deepEqual(a.state(),before);assert(a.node('modal').open);
 a.node('add-pantry').value='Zimt';a.node('ingredient-category').value='__new__';a.node('add-category-name').value='Backen';a.submit('add-pantry-form');assert(a.state().categories.includes('Backen'));assert(a.state().ingredients.some(i=>i.name==='Zimt'&&i.category==='Backen'));
});
test('Ingredient deletion in menu warns for recipes; cancel keeps state; confirm cleans refs',()=>{
 const a=app();a.load(fixture);a.click('ingredient-detail','chicken');const before=a.state();a.click('delete-ingredient','chicken');assert.equal(a.node('modal').dataset.kind,'removal');assert(a.node('modal').innerHTML.includes('Chicken Bowl'));assert.deepEqual(a.state(),before);
 a.click('close-modal');assert.deepEqual(a.state(),before);a.click('ingredient-detail','chicken');a.click('delete-ingredient','chicken');a.click('confirm-removal');assert(!a.state().ingredients.some(i=>i.id==='chicken'));assert(!a.state().recipes[0].items.some(it=>it.ingredientId==='chicken'));assert(!a.state().pantry.includes('chicken'));
});
test('Search Escape clears query, shopping checkboxes and custom JSON fields remain',()=>{
 const a=app();a.load(fixture);a.click('tab',undefined,{tab:'vorrat'});a.input('pantry-search','reis');a.events.keydown({target:a.node('pantry-search'),key:'Escape',preventDefault(){}});assert.equal(a.run('ui.pantryQuery'),'');a.click('tab',undefined,{tab:'einkauf'});assert(a.node('app').innerHTML.includes('type="checkbox"'));assert.deepEqual(a.state().customField,{preserve:true});
});
test('JSON unchanged and PWA cache version matches release contents',()=>{
 if(initialJsonHash)assert.equal(crypto.createHash('sha256').update(fs.readFileSync('meal-match.json')).digest('hex'),initialJsonHash);
 const v=crypto.createHash('sha256').update(fs.readFileSync('index.html')).update(fs.readFileSync('pwa.js')).digest('hex').slice(0,16);assert(fs.readFileSync('sw.js','utf8').includes("const VERSION = 'v2-"+v+"';"));
});

test('Undo restores stock, checked state and the saved/unsaved indicator',()=>{
 const a=app();a.load(fixture);const before=a.state();a.click('toggle-pantry','pepper');assert.equal(a.run('undoStack.length'),1);assert(a.node('toast').innerHTML.includes('Rückgängig'));a.click('undo');assert.deepEqual(a.state(),before);assert.equal(a.run('isDirty()'),false);assert.equal(a.run('undoStack.length'),0);
 a.click('toggle-pantry','pepper');a.click('toggle-pantry','chicken');a.click('undo');assert(a.state().pantry.includes('pepper'));assert(!a.state().pantry.includes('chicken'));a.click('undo');assert.deepEqual(a.state(),before);
});
test('Undo restores deletion including ingredient ID, recipe links and groups',()=>{
 const a=app();a.load({...fixture,ingredientGroups:[{id:'g',name:'Alternativen',ingredientIds:['chicken','pepper']}]});const before=a.state();a.click('ingredient-detail','chicken');a.click('delete-ingredient','chicken');a.click('confirm-removal');assert.equal(a.state().ingredientGroups.length,0);a.click('undo');assert.deepEqual(a.state(),before);
});
test('Successful JSON replacement clears undo history and keeps old JSON compatible',()=>{
 const a=app();a.load(fixture);a.click('toggle-pantry','pepper');a.load(fixture);assert.equal(a.node('modal').dataset.kind,'import-confirm');a.click('confirm-import');assert.equal(a.run('undoStack.length'),0);assert.equal(a.state().ingredientGroups.length,0);assert.equal(a.run('isDirty()'),false);
});
test('Accordion choices are UI-only and search expands matching categories',()=>{
 const a=app();a.load(fixture);const before=a.state();a.click('tab',undefined,{tab:'vorrat'});
 a.run('app.contains=()=>true');
 a.events.toggle({target:{matches(){return true},dataset:{category:'Gemüse & Obst'},open:false}});
 assert(a.run('ui.collapsedCategories.has("Gemüse & Obst")'));let markup=a.run('renderPantryResults()');assert(markup.includes('data-category="Gemüse &amp; Obst" ><summary'));
 a.input('pantry-search','Paprika');markup=a.node('pantry-results').innerHTML;assert(markup.includes('data-category="Gemüse &amp; Obst" open'));
 a.click('clear-pantry-query');assert(a.node('pantry-results').innerHTML.includes('data-category="Gemüse &amp; Obst" ><summary'));assert.deepEqual(a.state(),before);assert.equal(a.run('isDirty()'),false);
});
test('Mobile selection opens, removes plans and disappears when empty',()=>{
 const a=app();a.load(fixture);assert(a.node('app').innerHTML.includes('mobile-plan-toggle'));assert(a.node('app').innerHTML.includes('id="mobile-plan-content" hidden'));
 a.click('toggle-mobile-plan');assert.equal(a.run('ui.planExpanded'),true);assert(!a.node('app').innerHTML.includes('id="mobile-plan-content" hidden'));a.click('plan','bowl');assert(!a.node('app').innerHTML.includes('mobile-plan-toggle'));a.click('undo');assert(a.node('app').innerHTML.includes('mobile-plan-toggle'));
});
const groupedFixture={...fixture,ingredients:[{id:'lemon',name:'Zitrone',category:'Gemüse & Obst'},{id:'lime',name:'Limette',category:'Gemüse & Obst'},{id:'gouda',name:'Gouda',category:'Milchprodukte & Eier'},{id:'mozz',name:'Mozzarella',category:'Milchprodukte & Eier'},{id:'rice',name:'Reis',category:'Brot, Nudeln & Beilagen'}],recipes:[{id:'a',name:'Reis mit Zitrone',items:[{ingredientId:'lemon',role:'required'},{ingredientId:'rice',role:'required'},{ingredientId:'mozz',role:'optional'}]},{id:'b',name:'Reis mit Limette und Gouda',items:[{ingredientId:'lime',role:'required'},{ingredientId:'gouda',role:'required'}]},{id:'c',name:'Reis mit Mozzarella',items:[{ingredientId:'mozz',role:'required'}]}],pantry:['lime','rice','gouda'],plan:['a','b','c'],checked:[],ingredientGroups:[{id:'citrus',name:'Zitrone & Limette',ingredientIds:['lemon','lime']},{id:'cheese',name:'Käse',ingredientIds:['gouda','mozz']}]};
test('Equivalent pantry ingredients unlock recipes while actual stock stays separate',()=>{
 const a=app();a.load(groupedFixture);assert.equal(a.run('getMatch(recipe("a")).status'),'ready');assert.equal(a.run('getMatch(recipe("c")).status'),'ready');assert.equal(a.run('getShopping().length'),0);assert(!a.state().pantry.includes('lemon'));assert(!a.state().pantry.includes('mozz'));a.click('detail','a');assert(a.node('modal').innerHTML.includes('Stattdessen: Limette'));assert(a.node('modal').innerHTML.includes('Stattdessen: Gouda'));
});
test('Shopping deduplicates groups, warns on all required uses, excludes and restores whole group',()=>{
 const a=app();a.load({...groupedFixture,pantry:['rice']});assert.equal(a.run('getShopping().length'),2);const rows=JSON.parse(a.run('JSON.stringify(getShopping())'));const citrus=rows.find(r=>r.id==='lemon'||r.id==='lime'),cheese=rows.find(r=>r.id==='gouda'||r.id==='mozz');
 assert.equal(citrus.recipeIds.length,2);assert.equal(cheese.recipeIds.length,3);
 a.click('remove-shopping',cheese.id);assert.equal(a.node('modal').dataset.kind,'removal');assert(a.node('modal').innerHTML.includes('Reis mit Mozzarella'));assert(a.node('modal').innerHTML.includes('Reis mit Limette und Gouda'));a.click('confirm-removal');assert.equal(a.run('getShopping().length'),1);
 a.click('add-ingredient-shopping','gouda');assert.equal(a.run('getShopping().length'),2);a.click('undo');assert.equal(a.run('getShopping().length'),1);
});
test('Buying a checked alternative preserves which cheese was actually bought',()=>{
 const a=app();a.load({...groupedFixture,pantry:['rice','lime'],checked:['gouda']});assert(a.run('shoppingIsChecked(getShopping()[0])'));a.click('buy-checked');assert(a.state().pantry.includes('gouda'));assert(!a.state().pantry.includes('mozz'));assert.equal(a.run('getShopping().length'),0);a.click('undo');assert(!a.state().pantry.includes('gouda'));assert(a.state().checked.includes('gouda'));
});
test('Group editor validates membership, saves, round-trips and undo removes group',()=>{
 const a=app();a.load({...groupedFixture,ingredientGroups:[]});a.click('open-groups');a.node('group-name').value='Zitrus';a.click('toggle-group-member','lemon');a.submit('group-form');assert(a.node('group-error').textContent.includes('mindestens zwei'));a.click('toggle-group-member','lime');a.submit('group-form');assert.equal(a.state().ingredientGroups.length,1);assert.equal(a.node('modal').open,false);
 const serialized=a.run('window.MealMatchFiles.exportText()');const b=app();b.load(JSON.parse(serialized));assert.equal(b.state().ingredientGroups[0].name,'Zitrus');assert.equal(b.run('getMatch(recipe("a")).status'),'ready');a.click('undo');assert.equal(a.state().ingredientGroups.length,0);
});
test('Invalid/overlapping group imports leave the currently loaded state intact',()=>{
 const a=app();a.load(groupedFixture);const before=a.state();let rejected=false;
 const bad={...groupedFixture,ingredientGroups:[{id:'x',name:'Bad',ingredientIds:['missing','rice']}]};try{a.load(bad)}catch{rejected=true}assert(rejected);assert.deepEqual(a.state(),before);
 rejected=false;try{a.load({...groupedFixture,ingredientGroups:[...groupedFixture.ingredientGroups,{id:'overlap',name:'Bad',ingredientIds:['rice','lime']}]})}catch{rejected=true}assert(rejected);assert.deepEqual(a.state(),before);
});
(async()=>{
 const a=app();a.load({...groupedFixture,pantry:['rice','lime']});
 const result=await a.run('calculateBestValue(state.recipes,state.pantry,1)');assert.equal(result.ids.length,1);assert.equal(result.count,2);assert(['mozz','gouda'].includes(result.ids[0]));assert.deepEqual([...result.unlocked].sort(),['b','c']);console.log('PASS Best Value: one cheese unlocks both recipes, optional ingredients do not affect cooking.');
 console.log((count+1)+' checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
