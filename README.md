# PWA-Timer [Finished]
PWA-Timr is a Progressive Web App implementation of a stopwatch with set interval reminders. It can be used as chrome desktop application outside of the web interface and it can also be used as a mobile app when added to the homescreen on browsers that support progressive web apps; in both cases the site will work offline once it has been loaded once.

Similar to my other repo [Productivity Timer](https://github.com/pjaerr/Productivity-Timer), this is a tiny project aimed at delving more in what PWAs are, how they work and how they deal with serving the entire functionality offline as well notification control of a web app as if it were native.

In terms of the app, it will give you a timer, you can run the timer, pause the timer or reset the timer. When the timer reaches a given interval (say 1 hour 30 minutes), it will notify you, and then count to that interval again. So you would get a reminder at 1:30:00, but also at 3:00:00. 

**Due to restrictions on mobile devices, the timer cannot continue counting in real time when in the background, so it is rendered sort of useless as a 'native' mobile app, but the concept of PWAs stays the same.**


