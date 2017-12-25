'use strict';

var storage = window.localStorage;

/**If the browser supports service workers, register it.*/
function initialiseServiceWorker()
{
  if ('serviceWorker' in navigator)
  {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function () { console.log('Service Worker Registered'); });
  }
}

function makeTimeString(num)
{
  num = num.toString();
  if (num < 10)
  {
    num = '0' + num;
  }

  return num;
}

function Timer()
{
  /**The hours section of the timer in HTML.*/
  this.hhHtml = document.getElementById('hh');
  /**The minutes section of the timer in HTML.*/
  this.mmHtml = document.getElementById('mm');
  /**The seconds section of the timer in HTML.*/
  this.ssHtml = document.getElementById('ss');

  this.isEnabled = false;


  this.changeState = function (state)
  {
    this.isEnabled = state;
    web_worker.postMessage(["state_change", this.isEnabled]);
  };

  this.pause = function ()
  {
    //If the state being changed into is false
    if (!this.isEnabled === false)
    {
      //make button a play sign.
      $("#changeStateBtn").html("<i class='material-icons'>play_arrow</i>");
    }
    else
    {
      //Make button a pause sign.
      $("#changeStateBtn").html("<i class='material-icons'>pause</i>");
    }

    this.changeState(!this.isEnabled);
    setAllStorage();
  };

  this.reset = function ()
  {
    //Reset the timer.
    web_worker.postMessage(["reset"]);
    this.hhHtml.innerText = makeTimeString(0);
    this.mmHtml.innerText = makeTimeString(0);
    this.ssHtml.innerText = makeTimeString(0);

    if (this.isEnabled)
    {
      this.pause();
    }

    setAllStorage();
  };
}

let timer = new Timer();


function Reminder()
{
  this.sound = new Audio("alarm.mp3");

  this.hoursPassed = 0;
  this.minutesPassed = 0;

  this.reminderInterval = [];

  this.setReminderInterval = function (hours, minutes, fromStorage)
  {
    fromStorage = fromStorage || false;

    this.reminderInterval[0] = hours;
    this.reminderInterval[1] = minutes;

    if (!fromStorage)
    {
      storage.setItem("interval", this.reminderInterval[0].toString() + "," + this.reminderInterval[1].toString());
    }
  }

  if (storage.getItem("interval") === null || storage.getItem("interval") === undefined)
  {
    this.reminderInterval = [2, 0];
  }
  else
  {
    let locallyStoredInterval = storage.getItem("interval").split(',');

    this.setReminderInterval(parseInt(locallyStoredInterval[0]), parseInt(locallyStoredInterval[1]), true);
  }
}

let reminderData = new Reminder();

$("#applyBtn").click(function ()
{
  reminderData.setReminderInterval($("#hoursSelect").val(), $("#minutesSelect").val());
  $('#timer-container').css('display', 'block');
  $('#settings-container').css('display', 'none');
});

function updateTimer(data)
{
  switch (data.type)
  {
    case 'ss':
      timer.ssHtml.innerText = makeTimeString(data.value);

      if (data.value % 10 === 0)
      {
        setAllStorage();
      }
      break;
    case 'mm':
      timer.mmHtml.innerText = makeTimeString(data.value);
      reminderData.minutesPassed++;
      break;
    case 'hh':
      timer.hhHtml.innerText = makeTimeString(data.value);
      reminderData.hoursPassed++;
      break;
  }

  if (reminderData.hoursPassed == reminderData.reminderInterval[0]
    && reminderData.minutesPassed == reminderData.reminderInterval[1])
  {
    reminderData.sound.play();
    reminderData.hoursPassed = 0;
    reminderData.minutesPassed = 0;
  }
}



let web_worker;
function startBackgroundProcess()
{
  if (typeof (Worker) !== "undefined")
  {
    if (typeof (web_worker) == "undefined")
    {
      web_worker = new Worker("background_process.js");
    }
    web_worker.onmessage = function (event)
    {
      updateTimer(event.data);
    };
  }
  else
  {
    alert("Browser not supported..");
  }
}


function setAllStorage()
{
  storage.setItem("hh", timer.hhHtml.innerText);
  storage.setItem("mm", timer.mmHtml.innerText);
  storage.setItem("ss", timer.ssHtml.innerText);
}

//Called when app.js is first loaded.
function init()
{
  startBackgroundProcess();

  //If no local storage exists for the timer.
  if (storage.getItem("ss") === null || storage.getItem("ss") === undefined)
  {
    /**Store the timer values to localStorage once initially so retrieval
    * doesn't ever return null or undefined in the case of a timer not
    * being recently saved to local storage.*/
    setAllStorage();
  }
  else
  {
    timer.hhHtml.innerText = storage.getItem("hh");
    timer.mmHtml.innerText = storage.getItem("mm");
    timer.ssHtml.innerText = storage.getItem("ss");

    web_worker.postMessage(["update_from_storage", parseInt(timer.hhHtml.innerText),
      parseInt(timer.mmHtml.innerText), parseInt(timer.ssHtml.innerText)]);
  }


  initialiseServiceWorker();

  window.addEventListener("beforeunload", function (e)
  {
    setAllStorage();
    return null;
  });

  $("#hoursSelect").val(reminderData.reminderInterval[0]).change();
  $("#minutesSelect").val(reminderData.reminderInterval[1]).change();
}

init();

//EVENTS
$("#changeStateBtn").click(function ()
{
  timer.pause();
});

$("#resetBtn").click(function ()
{
  timer.reset();
});