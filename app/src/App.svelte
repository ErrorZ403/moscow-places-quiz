<script lang="ts">
  import {onMount} from 'svelte';
  import {createSmartappDebugger, createAssistant} from '@sberdevices/assistant-client';
  import {setTheme} from './themes';
  import {logger} from "./utils";

  let assistant;
  let state = {
    count: 0,
    place: {name: 'Гараж', iso: 'Гараж'},
    variants: [
      {name: 'Место 1', used: false},
      {name: 'Место 2', used: false},
      {name: 'Место 3', used: false},
      {name: 'Место 4', used: false}
    ]
  };

  let token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZTcyYzg4MTkyOTlhODAzZDJhYjNiMzBkZjNjNTgwYmJmYzAwMjk0ODk1NGQ3NjVhNmRiZWE1MmQyZTUxNjg1NTM5YmU5MjcwMDQyNjI5OCIsImF1ZCI6IlZQUyIsImV4cCI6MTY1MzY0MDExMywiaWF0IjoxNjUzNTUzNzAzLCJpc3MiOiJLRVlNQVNURVIiLCJ0eXBlIjoiQmVhcmVyIiwianRpIjoiMzZkZjcwN2MtNGYwZS00YjJjLWJmMDEtNGE1MmRmYjJiNjU0Iiwic2lkIjoiMTY2Mzc2MWYtY2E3Yy00NmI3LWIwN2EtNDhhYzE4MzA1ZDYyIn0.SJSwGzzQgM2oG_rd1_sxYTxPFKpR4UzHdB8nSDWPD4i3YzLsiPmc1rOOo9WT6mjaOLxxUtudaem7n9m2FIDn5drkCavC6vza0NAIwL-ea6j2LUx5iS5iGeenJC1C3MwflG-NCoDijm-GdIFZwf45tVFGkL9sDN2DgYs-VmBLpDX447x3c7ck1BnvVxhgvGUNf0LiTaT6thOm2LNhq-aoKOzsNDcfTmYIt4qlK38ARHWfWUCmiVo_w-pY2FVQdkLcKxDmg2CC5sYEgQM6uXMJTU3dAAVwCdwpoeAOzZ9REzyHehXkqDYItL7NHxxTNcPB0HIawaEiHcNv-Gk5z2YLMBa4yySoMNJNz2Tt2prXnvZuHWJzCLr6mvmRPkyj6HwFwzTvvXoh4ZnvhapSxQP549eksq9o4V41zauSiOMWRNGub6TtWob6_3YRvfnLw-7Que7X1KBJd483YBlYB7QLOSzUTAU55S_jfVaYJzcujN8-ZsJ2ijnRry87ACSNhiQi7_zRid3gI8OEZhXQhH9pQ1BxygoOUVHMrLdB3lF8Pf2pJy7-wqKpGYEsB3dFJntMmtgth_fSR609v_hyThW31xeAT5qGFTqJaIx7iEpcOJNEB40G0UYwb-hL2Bn9-xDUqt0VaXElWYiprRWOSBO-RRYgF4ANIfnJB46fQfneDEM'
  let initPhrase = 'запусти Угадай место';

  let character = 'eva';
  $: setTheme(character);
  
  let buttons = [];

  onMount(() => {
    function getState() {
      return {state}
    }

    const init = () => {
      return createSmartappDebugger({
        token,
        initPhrase,
        getState,
      });
      //return createAssistant({getState});
    };
    assistant = init();

    assistant.on('start', () => {
      logger.log('SmartApp started');
    });

    assistant.on('data', event => {
      if (!event.type) {
        return;
      }

      if (event.type === 'character') {
        character = event.character.id;
      }

      if (event.type === 'smart_app_data') {
        if (event.smart_app_data.type === 'close_app') {
          logger.log('Closing app')
          assistant.close();
          return;
        }
        state = event.smart_app_data;
      }
      logger.log('data event:', event);
    });
  });

  function handleClick(i) {
    if (state.variants[i].name !== state.place.name) {
      state.variants[i].used = true;
    }
    assistant.sendData({
      action: {
        action_id: 'click',
        data: state.variants[i].name
      }
    })
  }
</script>

<main>
  <div class="card">
    <h2>Счет: {state.count}</h2>
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src="/photos/{state.place.iso}.jpg" />
      <div class="buttons">
        {#each state.variants as {name, used}, i}
          <button id='button-{i}' class:used on:click={() => {handleClick(i)}}>{name}</button>
        {/each}
      </div>
  </div>
</main>


<style>
  main {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background-color: var(--plasma-colors-background);
    background-image: var(--plasma-colors-gradient);
    color: var(--plasma-colors-text);
  }
  img {
    width: 50%;
    margin: 20px;
  }
  .card {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 30px 1px rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 30px 10px;
    width: 80vw;
    max-width: 1000px;
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: -5%;
  }
  .used {
    background-color: var(--plasma-colors-buttonCritical);
  }
  .used:hover, .used:focus {
    background: var(--plasma-colors-buttonCritical);
    border: 1px solid var(--plasma-colors-buttonWarning)
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 90%;
    min-width: 160px;
  }
  button {
    margin: 2%;
    padding: calc(7px + (15 - 7) * ((100vw - 200px) / (1440 - 200)));
    background: var(--plasma-colors-buttonAccent);
    color: var(--plasma-colors-buttonPrimary);
    font-weight: 700;
    font-size: calc(12px + (18 - 12) * ((100vw - 200px) / (1440 - 200)));
    transition: background ease 0.5s;
    border: 1px solid transparent;
    border-radius: 5px;
    user-select: none;
  }
  button:hover, button:focus {
    background: var(--plasma-colors-buttonFocused);
  }
  h2 {
    text-align: center;
    margin: 0;
    font-size: calc(20px + (26 - 20) * ((100vw - 200px) / (1440 - 200)));
  }
</style>