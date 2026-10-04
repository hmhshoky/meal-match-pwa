/* This PWA stores only static application assets. Meal Match data stays in JSON. */
(() => {
  'use strict';
  const status={ready:false,registration:null,prompt:null,installed:false,updating:false,starting:false,bound:false,error:false};
  const standalone=()=>navigator.standalone===true||Boolean(window.matchMedia?.('(display-mode: standalone)').matches);
  const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  function render(){
    document.querySelectorAll('[data-pwa-action="install"]').forEach(button=>{button.hidden=standalone()||status.installed;});
    document.querySelectorAll('[data-pwa-action="update"]').forEach(button=>{button.hidden=!status.registration?.waiting;button.disabled=status.updating;});
    const note=document.getElementById('pwa-status');
    if(note){note.hidden=!status.ready;note.textContent=navigator.onLine===false?'Offline verfügbar':'Für offline vorbereitet';}
  }

  function workerStatus(worker,type='CACHE_STATUS'){
    return new Promise(resolve=>{
      if(!worker||typeof MessageChannel!=='function'){resolve(false);return;}
      const channel=new MessageChannel();let finished=false;
      const timeout=setTimeout(()=>finish(false),type==='PREPARE_OFFLINE'?20000:4000);
      function finish(ready){if(finished)return;finished=true;clearTimeout(timeout);channel.port1.close();resolve(ready);}
      channel.port1.onmessage=event=>finish(event.data?.ready===true);
      try{worker.postMessage({type},[channel.port2]);}catch(_){finish(false);}
    });
  }

  async function checkReady(){
    const worker=navigator.serviceWorker?.controller;
    status.ready=await workerStatus(worker);
    if(!status.ready&&worker&&navigator.onLine!==false)status.ready=await workerStatus(worker,'PREPARE_OFFLINE');
    render();
  }

  function installationHelp(){
    const steps=ios()
      ? '<li>Öffne die GitHub-Pages-Adresse in <strong>Safari</strong>.</li><li>Tippe auf <strong>Teilen</strong>, je nach Safari-Ansicht über das Seitenmenü.</li><li>Wähle <strong>Zu Home-Bildschirm hinzufügen</strong>. Aktiviere <strong>Als Web-App öffnen</strong>, falls diese Option erscheint.</li><li>Tippe auf <strong>Hinzufügen</strong> und öffne Meal Match über das neue Symbol.</li>'
      : '<li>Öffne die Website in <strong>Chrome oder Edge</strong>.</li><li>Wähle <strong>App installieren</strong> im Browsermenü oder das Installationssymbol in der Adressleiste.</li><li>Öffne Meal Match über das neue App-Symbol.</li>';
    const local=location.protocol==='file:'||!window.isSecureContext;
    const readiness=local?'Die Installation funktioniert über die HTTPS-Adresse deiner Website. Eine lokal geöffnete HTML bleibt als normale Datei nutzbar.':status.ready?'Die App-Dateien sind für den Offline-Start vorbereitet.':'Öffne die App zunächst mit Internet und lass sie kurz geöffnet, damit die App-Dateien für offline geladen werden können.';
    showModal(modalHeader('Meal Match installieren')+'<div class="modal-body"><ol class="install-steps">'+steps+'</ol><div class="install-note"><p>'+readiness+'</p><p>Jeder neue Start ist leer. Lade deine JSON, bearbeite sie und sichere Änderungen mit Speichern. Die JSON wird nie automatisch zu GitHub hochgeladen.</p></div><div class="modal-footer"><button class="button primary" data-action="close-modal">Verstanden</button></div></div>','install');
  }

  async function install(){
    if(!status.prompt){installationHelp();return;}
    const prompt=status.prompt;status.prompt=null;await prompt.prompt();const choice=await prompt.userChoice;
    if(choice?.outcome==='accepted')status.installed=true;render();
  }

  function offerUpdate(){
    if(!status.registration?.waiting)return;
    if(!window.MealMatchPWA?.canReload()){toast('Speichere deine JSON, bevor du das Update lädst.');return;}
    showModal(modalHeader('App aktualisieren?')+'<div class="modal-body"><p>Meal Match wird neu geöffnet und startet wieder leer. Lade danach deine JSON erneut.</p><div class="modal-footer"><button class="button" data-action="close-modal">Abbrechen</button><button class="button primary" data-pwa-action="apply-update">Update laden</button></div></div>','update');
  }

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-pwa-action]');if(!button||button.disabled)return;
    if(button.dataset.pwaAction==='install'){try{await install();}catch(_){installationHelp();}}
    else if(button.dataset.pwaAction==='update')offerUpdate();
    else if(button.dataset.pwaAction==='apply-update'&&status.registration?.waiting){
      if(!window.MealMatchPWA?.canReload()){toast('Speichere zuerst deine JSON.');return;}
      status.updating=true;button.disabled=true;render();status.registration.waiting.postMessage({type:'SKIP_WAITING'});
    }
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();status.prompt=event;render();});
  window.addEventListener('appinstalled',()=>{status.installed=true;status.prompt=null;render();});
  window.addEventListener('offline',render);
  window.addEventListener('online',()=>{render();if(status.registration){checkReady();status.registration.update().catch(()=>{});}else start();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){checkReady();if(navigator.onLine!==false)status.registration?.update().catch(()=>{});}});

  async function start(){
    render();
    if(status.starting||!('serviceWorker' in navigator)||!window.isSecureContext)return;
    status.starting=true;
    if(!status.bound){
      status.bound=true;
      navigator.serviceWorker.addEventListener('controllerchange',()=>{
        if(status.updating){
          if(window.MealMatchPWA?.canReload()){location.reload();return;}
          status.updating=false;toast('Das Update ist bereit. Sichere vor dem Neustart deine JSON.');
        }
        checkReady();
      });
    }
    try{
      status.registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});status.error=false;
      const registration=status.registration;
      const watch=worker=>{if(worker)worker.addEventListener('statechange',()=>{render();if(worker.state==='activated')checkReady();});};
      registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);render();
      navigator.serviceWorker.ready.then(()=>checkReady()).catch(()=>{});
      if(navigator.serviceWorker.controller)await checkReady();
    }catch(_){status.error=true;status.ready=false;render();}
    finally{status.starting=false;}
  }
  window.MealMatchPWA.status=()=>({ready:status.ready,installed:standalone()||status.installed,updateAvailable:Boolean(status.registration?.waiting)});
  start();
})();
