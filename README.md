# custom-select
Equivalent of bootstrap-select, but independent of jquery. Please download and launch the file **custom_select_demo.html** to see it live (As no backend server is set up in the demo, the serverside custom-selects have limited features.)

- ## Client Side
  Client side selects are very easy to use:

  HTML
  ```html
   <div class="form-group">
        <label for="countrySelect">Country</label>
        <select class="form-control" id="countrySelect">
            <option value="AT">Austria</option>
            <option value="BE">Belgium</option>
            <option value="BG">Bulgaria</option>
            <option value="HR">Croatia</option>
        </select>
    </div>
  ```

  JS
  ```javascript
    const select_element = document.getElementById('countrySelect');
    const custom_select = new CustomSelect(select_element);
  ```

  And you get:
  
