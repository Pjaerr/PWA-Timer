"use strict"; //Forces strict JS syntax.

let canUseNotifications = true;


var storage = window.localStorage; //Reference to the html5 localstorage.
/**If the browser supports service workers, register it.*/
function initialiseServiceWorker()
{
  if ('serviceWorker' in navigator)
  {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function () { console.log('Service Worker Registered'); });
  }
  else
  {
    window.alert("Your browser doesn't support service workers, the app may not work.");
  }
}

/*-----------------------:UTIL FUNCTIONS-----------------------*/

/**Makes a number fit within the 00:00:00 format by placing a 0 before a single digit number*/
function makeTimeString(num)
{
  num = num.toString();

  if (num < 10)
  {
    num = '0' + num;
  }

  return num;
}


/*-----------------------:TIMER-----------------------*/

/**The Timer object. It holds the html elements pertaining to the timer and whether the timer is enabled.
 * It contains functionality to pause/play the timer, and to reset the timer. The actual counting of the timer
 * itself is carried out within the background_process.js script as a web worker, communicating with the Timer object.*/
function Timer()
{
  /**The hours section of the timer in HTML.*/
  this.hhHtml = document.getElementById('hh');
  /**The minutes section of the timer in HTML.*/
  this.mmHtml = document.getElementById('mm');
  /**The seconds section of the timer in HTML.*/
  this.ssHtml = document.getElementById('ss');

  let isEnabled = false;

  /**Flip the current timer state and update the icon in html to represent the new state and
   * call setAllStorage() to update the local storage timer values with the current values*/
  this.changeState = function ()
  {
    //If the state being changed into is false
    if (!isEnabled === false)
    {
      //make button a play sign.
      $("#changeStateBtn").html("<i class='material-icons'>play_arrow</i>");
    }
    else
    {
      //Make button a pause sign.
      $("#changeStateBtn").html("<i class='material-icons'>pause</i>");
    }

    /*Stops or starts the web worker timer counting depending on the state of this timer object*/
    isEnabled = !isEnabled
    web_worker.postMessage(["state_change", isEnabled]);

    setAllStorage();
  };

  /**Tell the web worker to reset it's values for the timer, and then clear the timer within the html.
   * If the timer is still running, pause it after resetting and then update the local storage.*/
  this.reset = function ()
  {
    //Reset the timer.
    web_worker.postMessage(["reset"]);
    this.hhHtml.innerText = "00";
    this.mmHtml.innerText = "00";
    this.ssHtml.innerText = "00";

    if (isEnabled)
    {
      this.changeState();
    }

    setAllStorage();
  };
}

let timer = new Timer(); //Create an instance of the Timer object.

//Timer UI Events
$("#changeStateBtn").click(function () { timer.changeState(); });

$("#resetBtn").click(function () { timer.reset() });

/**The function that takes the new values from the counted timer on the web worker and
 * updates the html. It also controls when a sound should be played to signal a reminder and
 * autosaves the timer in localstorage every 10 seconds.*/
function updateTimer(data)
{
  /*data is passed when the web worker posts a message and contains a type and a value.
  data.type is either 'hh', 'mm' or 'ss' and the value is the corresponding updated value.*/
  switch (data.type) 
  {
    case 'ss':
      timer.ssHtml.innerText = makeTimeString(data.value); //Set the html for seconds to the new data.value.

      /*If 10 seconds has passed, update the local storage*/
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

  /*If the time passed has reached the set interval, play a reminder sound and reset the time passed
  to be checked again*/
  if (reminderData.intervalHasPassed())
  {
    reminderData.sound.play();
    reminderData.hoursPassed = 0;
    reminderData.minutesPassed = 0;

    if (canUseNotifications)
    {
      if (Notification.permission !== "granted")
      {
        Notification.requestPermission();
      }
      else
      {
        let notification = new Notification("Times up!",
          {
            icon: "icon-144x144.png",
            silent: true
          });

        notification.onclick = function ()
        {
          notification.close();
        }
      }
    }
  }
}

/*-----------------------:REMINDERS-----------------------*/

/**The Reminder object contains the sound, the amount of time passed in hours and minutes, the interval
 * at which the reminder should be triggered and then the functionality to set the reminder interval.*/
function Reminder()
{
  this.sound = new Audio("alarm.mp3");

  /*Amount of time passed between each reminder interval*/
  this.hoursPassed = 0;
  this.minutesPassed = 0;

  /*Every [hours, minutes] the reminder should be triggered*/
  this.reminderInterval = [];

  this.isEnabled = false;

  /**Sets the hours and minutes of the timer, and takes an optional parameter which
   * will be true when the reminder interval is being loaded from local storage, to avoid
   * re-setting the local storage with the same value.*/
  this.setReminderInterval = function (hours, minutes, fromStorage)
  {
    fromStorage = fromStorage || false;

    this.reminderInterval[0] = hours;
    this.reminderInterval[1] = minutes;

    //If no reminder is set, disable the timer.
    this.isEnabled = !(hours === 0 && minutes === 0);

    /*If the data isn't from local storage, set the local storage to the current reminder interval*/
    if (!fromStorage)
    {
      storage.setItem("interval", this.reminderInterval[0].toString() + "," + this.reminderInterval[1].toString());
    }
  }

  /**If reminders are enabled and the hours and minutes passed is the same as
   * the set interval, return true.*/
  this.intervalHasPassed = function ()
  {
    return (this.isEnabled && this.hoursPassed === this.reminderInterval[0]
      && this.minutesPassed === this.reminderInterval[1]);
  }

  /**Gets called when the app is first loaded and the Reminder object is created.
   * It sets the reminder interval to 2 hours if no local storage for the interval
   * is found. If there is local storage for the interval, it will grab that data and set
   * the current reminder interval.*/
  if (storage.getItem("interval") === null || storage.getItem("interval") === undefined)
  {
    this.setReminderInterval(0, 0);
  }
  else
  {
    let locallyStoredInterval = storage.getItem("interval").split(','); //Split the local storage eg. "2,30"

    this.setReminderInterval(parseInt(locallyStoredInterval[0]), parseInt(locallyStoredInterval[1]), true);
  }


}

let reminderData = new Reminder(); //Create the instance of Reminder()


/*-----------------------:SETTINGS FUNCTIONALITY-----------------------*/

/**Swaps the display style of the timer container and the settings container, assuming
 * one of them starts as display none;*/
function switchDisplay()
{
  let timerDisplay = document.getElementById("timer-container").style.display;
  let settingsDisplay = document.getElementById("settings-container").style.display;
  $('#timer-container').css('display', settingsDisplay);
  $('#settings-container').css('display', timerDisplay);
}

/**When the apply button is clicked on the settings menu, set the reminderInterval to the
 * values selected in the dropdowns and then switch back to the timer display*/
$("#applyBtn").click(function ()
{
  reminderData.setReminderInterval(parseInt($("#hoursSelect").val()), parseInt($("#minutesSelect").val()));
  switchDisplay();
});

/**Switch to the settings display when the settings button is clicked.*/
$("#settingsBtn").click(function ()
{
  switchDisplay();
});

/**Switch to the timer display when the back button is clicked.*/
$("#backBtn").click(function ()
{
  switchDisplay();
});

/**Set the selected items in the dropdown menu to be equal to the currently stored
   * reminder interval values.*/
$("#hoursSelect").val(reminderData.reminderInterval[0]).change();
$("#minutesSelect").val(reminderData.reminderInterval[1]).change();


/*-----------------------:WEB WORKERS-----------------------*/


let web_worker;

/**If web workers are supported, create a new one that utilises background_process.js
 * and store it inside of web_worker. Setup an event listener that is triggered when
 * postMessage() is called from within background_process.js. This event listener will call updateTimer(),
 * passing in the data received from postMessage() which should only contain a type and a value.*/
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
    window.alert("Browser not supported..");
  }
}

/*-----------------------:LOCAL STORAGE AND INITIALISATION-----------------------*/

/**Sets all of the stored values from the timer to the current values in the html.*/
function setAllStorage()
{
  storage.setItem("hh", timer.hhHtml.innerText);
  storage.setItem("mm", timer.mmHtml.innerText);
  storage.setItem("ss", timer.ssHtml.innerText);
}

/**Is called when app.js is first loaded.*/
function init()
{
  startBackgroundProcess(); //Start the web worker.

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
    /*Make the current timer values in the html equal to the locally stored values.*/
    timer.hhHtml.innerText = storage.getItem("hh");
    timer.mmHtml.innerText = storage.getItem("mm");
    timer.ssHtml.innerText = storage.getItem("ss");

    /*Tell the web worker to update it's values by the locally stored values parsed as integers.*/
    web_worker.postMessage(["update_from_storage", parseInt(timer.hhHtml.innerText),
      parseInt(timer.mmHtml.innerText), parseInt(timer.ssHtml.innerText)]);
  }


  initialiseServiceWorker();

  /**If the user closes the page in any shape or form, save the current timer values to local storage.*/
  window.addEventListener("beforeunload", function (e)
  {
    setAllStorage();
    return null;
  });
}

init();