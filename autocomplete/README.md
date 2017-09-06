## PV. Autocomplete
**Usage**

    new Autocomplete(input, config)

**Config options**

`inputTimeout: 300` - Delay before starting search.

`data: []` - Suggestions list (local).

`url: null` - URL of suggestions source (remote). Response as JSON array.

`minTermLength: 3` - Minimal symbols amount to start searching.
			
`limit: 10` - Suggestions amount limit.
***
    Example: <input type="text" id="example"> (type "ia")

    <script>
    (function () {
      var a = new Autocomplete(example, {
        data: ["Romania", "Russia", "Australia", "Bulgaria"],
        minTermLength: 2
      });
    })();
    </script>
