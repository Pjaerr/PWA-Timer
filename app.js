'use strict';

function LocalStorage()
{
  this.localStorage = window.localStorage;

  this.set = function (name, value)
  {
    this.localStorage.setItem(name, value);
  }
  this.get = function (name)
  {
    return this.localStorage.getItem(name);
  }
  this.getAll = function ()
  {
    var values = [],
      keys = Object.keys(this.localStorage),
      i = keys.length;

    while (i--) 
    {
      values.push(this.localStorage.getItem(keys[i]));
    }

    return values;
  }
  this.remove = function (name)
  {
    this.localStorage.removeItem(name);
  }
}

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
    this.isEnabled = true;
    let count = 0;

    if (!this.hasStarted)
    {
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
    }
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
}

let storage = new LocalStorage();
let timer = new Timer();

function setAllStorage()
{
  storage.set("hh", timer.hhHtml.innerText);
  storage.set("mm", timer.mmHtml.innerText);
  storage.set("ss", timer.ssHtml.innerText);
}

//Called when app.js is first loaded.
function init()
{
  timer.start();

  //If no local storage exists for the timer.
  if (storage.get("ss") === null || storage.get("ss") === undefined)
  {
    /**Store the timer values to localStorage once initially so retrieval
    * doesn't ever return null or undefined in the case of a timer not
    * being recently saved to local storage.*/
    setAllStorage();
  }
  else
  {
    timer.hhHtml.innerText = storage.get("hh");
    timer.hh = parseInt(timer.hhHtml.innerText);
    timer.mmHtml.innerText = storage.get("mm");
    timer.mm = parseInt(timer.mmHtml.innerText);
    timer.ssHtml.innerText = storage.get("ss");
    timer.ss = parseInt(timer.ssHtml.innerText);
  }


  initialiseServiceWorker();
}

init();