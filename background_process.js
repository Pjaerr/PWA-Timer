
let ss = 0;
let mm = 0;
let hh = 0;

let isEnabled = false;

function timerPostData(type, value)
{
    let data = {
        type: type,
        value: value
    }

    return data;
}

function timer()
{
    if (isEnabled)
    {
        ss += 1;
        if (ss >= 60)
        {
            ss = 0;
            mm += 1;
            if (mm >= 60)
            {
                hh += 1;
                mm = 0;


                postMessage(timerPostData('hh', hh));
            }

            postMessage(timerPostData('mm', mm));
        }

        postMessage(timerPostData('ss', ss));
    }

    setTimeout("timer()", 1000);
}

timer();


//Listen for events being sent to this web worker.
onmessage = function (event)
{
    if (event.data[0] === "state_change")
    {
        isEnabled = event.data[1];
    }
    else if (event.data[0] === "update_from_storage")
    {
        hh = event.data[1];
        mm = event.data[2];
        ss = event.data[3];
    }
    else if (event.data[0] === "reset")
    {
        ss = 0;
        mm = 0;
        hh = 0;
    }
}