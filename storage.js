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
