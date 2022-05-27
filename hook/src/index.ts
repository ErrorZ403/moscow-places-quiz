import { Dialute, SberRequest } from 'dialute';
import { data } from './data';


//const fs = require("fs");

//const rawData = fs.readFileSync("places.json");
//const places = JSON.parse(rawData);

const places = data;


function choice(choices: any, drop = false) {
  const index = Math.floor(Math.random() * choices.length);
  let chosen = choices[index];
  if (drop) {
    choices.splice(index, 1);
  }
  return chosen;
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function* script(r: SberRequest) {
  const rsp = r.buildRsp();
  let unusedPlaces = [...places];
  const state = {
    count: 0,
    place: {name: '', iso: ''},
    variants: [] as any[]
  }

  function updateState() {
    let place = choice(unusedPlaces, true);
    let variants = [] as any[];
    let temp_variants = [] as any[]
    variants.push({name: place.name, used: false});
    temp_variants.push(place.name);
    
    let i = 0
    while (i < 3){
      let temp = choice(places);
      if (temp_variants.includes(temp.name)){
        continue
      }
      variants.push({name: temp.name, used: false});
      temp_variants.push(temp.name);
      i++;
    } 

    shuffle(variants);
    state.place = place;
    state.variants = variants;
    rsp.data = state;
  }

  function useButton(place: any) {
    for (const [i, v] of state.variants.entries()) {
      if (place.toLowerCase() === v.name.toLowerCase()) {
        state.variants[i].used = true;
      }
    }
  }

  function afterCorrect() {
    updateState();
    state.count++;
    rsp.msg = choice(['Правильно!', 'Здорово!', 'Потрясающе!', 'Угадали!', 'Браво!', 'Вы молодец!']);
  }

  function afterWrong(useButtons = true){
    if (r.type == 'SERVER_ACTION'){
      if (useButtons){
        useButton(r.act.data);
      }
    } else{
      if (useButtons){
        useButton(r.msg);
      }
    }
    rsp.msg = choice(['Не угадали!', 'Неверно!', 'Неправильно!']);
  }

  updateState();
  rsp.msg = 'Добро пожаловать в игру Угадай место. Вам будут показаны фотографии различных мест Москвы. ' +
    'Вы должны угадать место. Если возникнут вопросы, скажите Помощь. ' +
    'Вопросы можно пропускать, сказав Далее. А вот и первое место';
  yield rsp;

  while (unusedPlaces.length > 0){
    if (r.type === 'SERVER_ACTION'){
      if (r.act?.action_id == 'click'){
        if (r.act.data == state.place.name){
          afterCorrect();
        }
        else{ 
          afterWrong();
        }
      }
      yield rsp;
      continue;
    }
    if (r.msg.toString().replace(/-/g, ' ').toLowerCase() === state.place.name.toString().replace(/-/g, ' ').toLowerCase()) {
      afterCorrect();
    }
    // else if (r.nlu.lemmaIntersection(['выход', 'выйти', 'выйди'])) {
    //   rsp.msg = 'Всего вам доброго!'
    //   rsp.end = true;
    //   rsp.data = {'type': 'close_app'}
    // }

    else if (r.nlu.lemmaIntersection(['помощь', 'помочь'])) {
      rsp.msg = 'Добро пожаловать в игру Угадай место. Вам будут показаны фотографии различных мест Москвы. ' +
      'Вы должны угадать место. Если возникнут вопросы, скажите Помощь. ' +
      'Вопросы можно пропускать, сказав Далее. А вот и первое место';
    }
    else if (r.nlu.lemmaIntersection(['следующий', 'далее']) || ['далее', 'следующий'].includes(r.msg.toLowerCase())) {
      updateState();
      rsp.msg = 'Обновляю'
    }
    else{
      afterWrong();
    }
    yield rsp;
  }
  rsp.msg = 'Поздравляю! Вы знаете все места Москвы!'
  rsp.data = {'type': 'close_app'}
  rsp.end = true;
  yield rsp;
}

Dialute
  .fromEntrypoint(script as GeneratorFunction)
  .shareApp('../app/public')
  .start();
