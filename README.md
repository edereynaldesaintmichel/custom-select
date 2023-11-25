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
  ![Screenshot_2023-11-25_22-04-43](https://github.com/edereynaldesaintmichel/custom-select/assets/152026212/2dda9f3e-57af-410a-9bb1-af17ec12a9bb)


- ## Server Side
  Client side selects need a server to work properly.

  HTML
  ```html
   <div class="form-group mt-5">
        <label for="countrySelect">Country (Serverside)</label>
        <select class="form-select serverside serverside_custom" id="countrySelectServerside" data-url="">
        </select>
    </div>
  ```

  JS
  ```javascript
    const serverside_select_element = document.getElementById('countrySelectServerside');
    const custom_select_serverside = new CustomSelect(serverside_select_element);
    // (nothing new here)
  ```
  
