let custom_select_instances = {};


class ObjectToURLString {
    static urlString = (data) => {
        if (data == null) { return ""; }

        const urlParams = new URLSearchParams();
        const rbracket = /\[\]$/;

        const add = (name, valueOrFunction) => {
            const value = typeof valueOrFunction === "function" ? valueOrFunction() : valueOrFunction;
            urlParams.append(name, value == null ? "" : value);
        };

        const buildParams = (prefix, obj) => {
            if (Array.isArray(obj)) {
                obj.forEach((value, index) => {
                    if (rbracket.test(prefix)) {
                        add(prefix, value);
                    } else {
                        const i = typeof value === "object" && value != null ? index : "";
                        buildParams(`${prefix}[${i}]`, value);
                    }
                });
            } else if (typeof obj === "object" && obj != null) {
                for (const [name, value] of Object.entries(obj)) {
                    buildParams(`${prefix}[${name}]`, value);
                }
            } else {
                add(prefix, obj);
            }
        };

        if (Array.isArray(data) || data instanceof NodeList) {
            data.forEach(el => add(el.name, el.value));
        } else {
            for (const [name, value] of Object.entries(data)) {
                buildParams(name, value);
            }
        }

        return urlParams.toString();
    };
}

function CustomSelect(select) {

    const unique_id = select.getAttribute('data-custom_select_id');
    if (unique_id) {
        return custom_select_instances[unique_id];
    }

    this.select = select;
    this.originalStyle = this.select.style.cssText;
    this.select.style.cssText += 'width: 0;height: 0;padding: 0;opacity: 0;margin: -1px; z-index: -1;';
    this.search_box = document.createElement('input');
    this.search = '';
    this.filtered_data = [];
    this.container = select.parentNode;
    this.dropdown_toggler = document.createElement('a');
    this.title_div = document.createElement('div');
    this.dropdown = document.createElement('div');
    this.identifier = Math.random().toString(36).slice(-10);
    this.multiple = this.select.multiple;
    this.serverside = this.select.classList.contains('serverside');
    this.serverside_custom = this.select.classList.contains('serverside_custom');
    this.option_size = 32;
    this.scroll_top = 0;
    this.dropdown_max_height = 400;
    this.options_visible = Math.ceil(this.dropdown_max_height / this.option_size);
    this.options_per_batch = 3 * this.options_visible;
    this.min_li_index = -1;
    this.max_li_index = this.min_li_index + Math.floor(this.options_per_batch / 2);
    this.focus_option_index = 0;

    this.getData = () => {
        this.filtered_data = [...this.select.options];
        this.select.dispatchEvent(new CustomEvent('getDataComplete'));
        this.focus_option_index = 0;
        return this;
    }

    this.getDataServerside = async (value = null) => {
        let url;
        let option_text = this.select.getAttribute('data-option_text') ?? 'text';
        const selected = [...this.select.options].filter(a => a.selected);
        let values = selected.map(a => String(a.value));
        const to_keep = [...this.select.options].filter(a => (!a.classList.contains('to_delete') && a.classList.contains('.original'))).concat(selected);
        const to_keep_values = to_keep.map(a => String(a.value));
        this.select.innerHTML = "";
        if (value) {
            values.push(value);
        }

        for (let option of to_keep) {
            this.select.appendChild(option);
        }

        if (this.serverside_custom) {
            url = this.select.getAttribute('data-url');
            const filter = this.select.getAttribute('data-filter');
            url += value ? `?id=${value}` : `?search=${this.search}${filter ? '&' + filter : ''}`;

        } else {
            const search_column = this.select.getAttribute('data-search_column');
            const table = this.select.getAttribute('data-search_table')
            const leading_table = table.split(' ')[0];

            let data = {
                table: table,
            };
            data.data = {};
            const pre_filter = this.select.getAttribute('data-pre_filter');
            if (value) {
                data.data[leading_table + '.' + 'id'] = { value: value, exact: true };
                data.data[search_column] = '';
                data.data[option_text] = '';
            } else {
                data.data = pre_filter ? JSON.parse(pre_filter) : {};
                data.data[search_column] = this.search;
                if (search_column != option_text) {
                    data.data[option_text] = '';
                }
            }
            url = `/search?${ObjectToURLString.urlString(data)}`;
        }

        const res = await fetch(url);
        const response = await res.json();

        for (let row of response) {
            const option = document.createElement('option');
            option.setAttribute('data-row', JSON.stringify(row));
            option.value = row.id;
            option.innerHTML = row[option_text];
            if (to_keep_values.indexOf(String(row.id)) !== -1) {
                continue;
            }
            this.select.appendChild(option);
        }
        for (let val of values) {
            const to_select = this.select.querySelector(`option[value="${val}"]`);
            if (!to_select) {
                continue;
            }
            to_select.selected = true;
        }
        for (let option of this.select.querySelectorAll('option:checked')) {
            if (values.indexOf(String(option.value)) == -1) {
                option.selected = false;
                if (!this.multiple) {
                    this.select.value = "";
                }
            }
        }
        return this.getData();
    };

    this.filter = () => {
        this.filtered_data = [...this.select.options].filter((option) => {
            const to_test = option.getAttribute('data-content') ?? option.innerHTML;
            if (option.selected || (new RegExp(this.search, 'i')).test(to_test)) {
                return true;
            }
            return false;
        });
        this.scroll_top = 0;
        this.focus_option_index = 0;

        return this;
    }

    this.initDom = () => {
        this.dropdown.classList.add('dropdown', 'custom_select');
        this.dropdown.setAttribute('data-select_id', this.select.id);
        this.dropdown.setAttribute('data-select_name', this.select.name);
        this.select.setAttribute('data-custom_select_id', this.identifier);
        this.dropdown_toggler.classList = this.select.classList;
        this.dropdown_toggler.classList.add('btn', 'btn-light', 'form-select', 'text-start');
        this.dropdown_toggler.setAttribute('data-bs-toggle', 'dropdown');
        if (this.multiple) {
            this.dropdown_toggler.setAttribute('data-bs-auto-close', 'outside');
        }

        this.title_div.classList.add('opacity-3', 'text-left');
        this.title_div.style.cssText = 'width:100%;margin-right:-0.7rem;text-overflow: ellipsis;overflow: hidden;';
        this.dropdown_toggler.appendChild(this.title_div);
        this.dropdown.appendChild(this.dropdown_toggler);


        let dropdown_outer = document.createElement('div');
        dropdown_outer.classList.add('dropdown-menu');
        dropdown_outer.style.cssText = `max-height: ${this.dropdown_max_height + 100}px; min-width: 100%; overflow:hidden`;

        let dropdown_inner = document.createElement('div');
        dropdown_inner.classList.add('inner', 'show');
        dropdown_inner.style.cssText = `max-height: ${this.dropdown_max_height}px; min-width: 100%; overflow:scroll`;


        let search_box_container = document.createElement('div');
        search_box_container.style.padding = '4px 8px';
        this.search_box.classList.add('form-control', 'select_search_box');
        search_box_container.appendChild(this.search_box);
        dropdown_outer.appendChild(search_box_container);

        this.ul = document.createElement('ul');
        this.ul.classList.add('dropdown-menu', 'inner', 'show');
        this.ul.style.cssText = 'position: static; border: 0px none; margin: 0px; padding: 0px;width: 100%;';

        dropdown_inner.appendChild(this.ul);
        dropdown_outer.appendChild(dropdown_inner);
        this.dropdown.appendChild(dropdown_outer);
        this.container.appendChild(this.dropdown);

        this.select.dispatchEvent(new CustomEvent('initDomComplete'));

        return this;
    }

    this.render = () => {
        this.ul.innerHTML = '';
        const data = this.filtered_data;
        const options_length = data.length;
        this.min_li_index = Math.max(Math.floor(this.scroll_top / this.option_size) - this.options_visible, 0)
        this.max_li_index = Math.min(this.min_li_index + this.options_per_batch, options_length - 1);
        const margin_bottom = this.option_size * (data.length - this.max_li_index - 1);
        this.ul.style.marginBottom = margin_bottom + 'px';
        this.ul.style.marginTop = this.min_li_index * this.option_size + 'px';

        for (let i = this.min_li_index; i < this.max_li_index + 1; i++) {
            const option = data[i];
            const value = option.value;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.classList = option.classList;
            a.classList.add('dropdown-item', `value-${value}`);
            a.setAttribute('data-value', value);
            a.innerHTML = option.getAttribute('data-content') ?? option.text;
            if (option.selected) {
                a.classList.add('active');
            }
            if (i === this.focus_option_index) {
                a.classList.add('focus');
            }
            li.appendChild(a);
            this.ul.appendChild(li);
        }
        this.select.dispatchEvent(new CustomEvent('renderComplete'));

        this.ul.closest('div').scrollTop = this.scroll_top;

        return this;
    }

    this.setTitle = () => {
        let titles = [...this.select.options].reduce((a, b) => {
            if (b.selected) {
                a.push(b.getAttribute('data-content') ?? b.text);
            }
            return a;
        }, []);
        if (titles.length > 0) {
            this.title_div.classList.remove('opacity-3');
            this.title_div.innerHTML = titles.join(', ');
            return this;
        }
        if (this.select.title) {
            this.title_div.classList.add('opacity-3');
            this.title_div.innerHTML = this.select.title;
            return this;
        }
        this.title_div.innerHTML = "Sélectionnez un élément";
        return this;
    }

    this.focusOption = () => {
        this.scroll_top = (this.focus_option_index - 2) * this.option_size;
        this.ul.closest('div').scrollTop = this.scroll_top;
        this.ul.querySelector('a.value-' + this.filtered_data[this.focus_option_index].value).classList.add('focus');
    }

    this.fillAndUpdate = async (value) => {
        await this.getDataServerside(value);
        this.select.value = value;
        this.render().setTitle();
    }

    this.refresh = async () => {
        this.search_value = "";
        this.getData();
        return this.setTitle();
    }

    this.hide = () => {
        (bootstrap.Dropdown.getOrCreateInstance(this.dropdown)).hide();
    }

    this.destroy = () => {
        this.select.style.cssText = this.originalStyle;
        this.dropdown.remove();
        this.select.removeAttribute('data-custom_select_id');
    }

    this.triggerChange = (detail = { no_get_data: true, ignore: false }) => {
        this.select.dispatchEvent(new CustomEvent('change',
            {
                bubbles: true,
                detail: detail,
            }));
    }

    this.aClickCallBack = (a, e) => {
        const already_selected = a.classList.contains('active');
        const value = a.getAttribute('data-value');
        const selected = !(this.multiple && already_selected) || (!this.multiple && !already_selected)
        let option = [...this.select.options].find((option) => {
            if (option.value == value) {
                return true;
            }
            return false;
        });
        option.selected = selected;
        this.triggerChange();
    }

    this.scrollCallBack = (e) => {
        const target = e.target;
        if (!e.isTrusted || (target.scrollTop == 0 && this.scroll_top == 0) || (target.scrollHeight - target.scrollTop == target.offsetHeight && this.scroll_top == target.scrollTop)) {
            return;
        }
        const scrolled_options = Math.round((target.scrollTop - this.scroll_top) / this.option_size);
        if (Math.abs(scrolled_options) >= this.options_visible) {
            this.scroll_top = target.scrollTop;
            this.render();
        }
    }

    this.dropdown.addEventListener('shown.bs.dropdown', async (e) => {
        this.scroll_top = 0;
        if (this.serverside) {
            await this.getDataServerside();
        }
        this.render().setTitle();
        this.search_box.focus();
        this.search_box.selectionStart = 0;
        this.search_box.selectionEnd = this.search.length;

        this.select.dispatchEvent(new CustomEvent('shown.cs.select', { bubbles: true }));
    });

    this.select.addEventListener('initDomComplete', (e) => {
        this.ul.closest('div').addEventListener('scroll', (e) => {
            this.scrollCallBack(e);
        });

        this.search_box.addEventListener('input', async (e) => {
            this.search = this.search_box.value;
            this.scroll_top = 0;
            if (this.serverside) {
                (await this.getDataServerside()).render().focusOption();
                return
            }
            this.filter().render().focusOption();
        });

        this.dropdown.addEventListener('mousedown', (e) => {
            if (!e.ctrlKey) {
                return;
            }
            follow_select_link(this.select);
        });

        this.search_box.addEventListener('keydown', (e) => {

            if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].indexOf(e.key) === -1) {
                return;
            }
            if (e.key == 'Tab' && !e.shiftKey) {
                (bootstrap.Dropdown.getOrCreateInstance(this.dropdown)).hide();
            }
            if (e.key == 'Tab' && e.shiftKey) {
                setTimeout(() => {
                    (bootstrap.Dropdown.getOrCreateInstance(this.dropdown)).hide();
                }, 100);
                return;
            }
            e.preventDefault();
            e.stopPropagation();

            if (e.key == 'ArrowUp') {
                this.focus_option_index--;
                this.focus_option_index < 0 && (this.focus_option_index = 0);
            }

            if (e.key == 'ArrowDown') {
                this.focus_option_index++;
                this.focus_option_index > this.filtered_data.length - 1 && (this.focus_option_index = this.filtered_data.length - 1);
            }

            if (e.key == 'Enter') {
                this.focus_option_index < 0 && (this.focus_option_index = 0);
                this.filtered_data[this.focus_option_index].selected = true;
                this.triggerChange();
                if (!this.multiple) {
                    (bootstrap.Dropdown.getOrCreateInstance(this.dropdown)).hide();
                }
                return;
            }

            this.render().focusOption();
        });
    });

    this.select.addEventListener('renderComplete', (e) => {
        for (let a of this.ul.getElementsByTagName('a')) {
            a.addEventListener('click', (e) => {
                this.aClickCallBack(a, e);
            });
        }
    });

    this.select.addEventListener('invalid', (e) => {
        this.dropdown_toggler.classList.add('is-invalid');
    });

    this.select.addEventListener('focusin', (e) => {
        (bootstrap.Dropdown.getOrCreateInstance(this.dropdown)).show();
    });

    this.select.addEventListener('change', async (e) => {
        if (e.detail && e.detail.ignore) {
            return;
        }
        this.focus_option_index = 0;
        if (e.detail && e.detail.no_get_data) {
            this.render().setTitle();
            return;
        }
        // if (this.serverside && e.detail.value) {
        //     e.stopPropagation();
        //     await this.fillAndUpdate(e.detail.value);
        //     this.triggerChange({...e.detail, no_get_data: true, ignore: true});
        // }
        this.getData().render().setTitle();
        this.dropdown_toggler.classList.remove('is-invalid');
    });

    this.initDom().getData().render().setTitle();

    custom_select_instances[this.identifier] = this;
}



function getCustomSelect(select) {
    const unique_id = select.getAttribute('data-custom_select_id');
    if (!unique_id) {
        return false;
    }
    return custom_select_instances[unique_id];
}