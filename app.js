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
  /**The hours section of the timer as an integer.*/
  this.hh = 0;
  /**The minutes section of the timer as an integer.*/
  this.mm = 0;
  /**The seconds section of the timer as an integer.*/
  this.ss = 0;

  /**The hours section of the timer in HTML.*/
  this.hhHtml = document.getElementById('hh');
  /**The minutes section of the timer in HTML.*/
  this.mmHtml = document.getElementById('mm');
  /**The seconds section of the timer in HTML.*/
  this.ssHtml = document.getElementById('ss');

  this.isEnabled = false;

  this.start = function ()
  {
    let count = 0;

    setInterval(function ()
    {
      if (this.isEnabled)
      {
        count += 1;

        this.ss += 1;
        if (this.ss >= 60)
        {
          this.ss = 0;
          this.mm += 1;
          if (this.mm >= 60)
          {
            this.hh += 1;
            this.mm = 0;

            this.updateTimer('hh'); //If an hour is added, update hh string.
          }

          this.updateTimer('mm'); //If a minute is added, update mm string.
        }

        this.updateTimer('ss'); //If a second is added, update ss string.

      }

    }.bind(this), 1000);
  };

  this.changeState = function (state)
  {
    this.isEnabled = state;
  };

  this.updateTimer = function (section)
  {
    switch (section)
    {
      case 'ss':
        this.ssHtml.innerText = makeTimeString(this.ss);
        break;
      case 'mm':
        this.mmHtml.innerText = makeTimeString(this.mm);
        break;
      case 'hh':
        this.hhHtml.innerText = makeTimeString(this.hh);
        break;
    }

    //Push the updated timer to localStorage every 10 seconds.
    if (this.ss % 10 === 0)
    {
      setAllStorage();
    }
  };

  this.pause = function ()
  {
    //If the state being changed into is false
    if (!timer.isEnabled === false)
    {
      //make button a play sign.
      $("#changeStateBtn").html("<i class='material-icons'>play_arrow</i>");
    }
    else
    {
      //Make button a pause sign.
      $("#changeStateBtn").html("<i class='material-icons'>pause</i>");
    }

    timer.changeState(!timer.isEnabled);
    setAllStorage();
  };

  this.reset = function ()
  {
    //Reset the timer.
    this.hh = 0;
    this.hhHtml.innerText = makeTimeString(this.hh);
    this.mm = 0;
    this.mmHtml.innerText = makeTimeString(this.mm);
    this.ss = 0;
    this.ssHtml.innerText = makeTimeString(this.ss);
    this.pause();
  };
}

let timer = new Timer();

function setAllStorage()
{
  storage.setItem("hh", timer.hhHtml.innerText);
  storage.setItem("mm", timer.mmHtml.innerText);
  storage.setItem("ss", timer.ssHtml.innerText);
}

//Called when app.js is first loaded.
function init()
{
  timer.start();

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
    timer.hh = parseInt(timer.hhHtml.innerText);
    timer.mmHtml.innerText = storage.getItem("mm");
    timer.mm = parseInt(timer.mmHtml.innerText);
    timer.ssHtml.innerText = storage.getItem("ss");
    timer.ss = parseInt(timer.ssHtml.innerText);
  }


  initialiseServiceWorker();
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