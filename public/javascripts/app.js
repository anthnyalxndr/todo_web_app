class App {
  constructor() {
    this.api = new API();
    this.dataReady = new Promise((res) => {
      this.subscribe("data_ready", res);
    });
    this.domReady = new Promise((res) => {
      this.subscribe("DOMContentLoaded", res);
    });
    Promise.all([this.dataReady, this.domReady]).then(() => {
      this.publish(new CustomEvent("templates_ready"));
    });
    this.listeners = [];
    this.bindListeners();
    this.api.read();
    this.activeList = "All Todos";
    this.validationMessages = [];
    this.templates = { data: {} };
    this.form = null;
    this.modalLayer = null;
    this.modalElements = null;
  }

  async onTemplatesReady(event) {
    try {
      this.createTemplates();
      this.createTemplateData();
      this.renderMainTemplate();
    } catch (e) {
      throw e;
    }
  }

  _populateDB() {
    let count = 10,
      setTodos = false;
    let todos = this.createSeedTodos(count);
    todos.forEach(async ({ id, ...t }) => {
      // Use await to ensure order is maintained in the todos
      // saved to the server.
      await this.api.create(JSON.stringify(t));
    });
  }

  publish(event) {
    document.dispatchEvent(event);
  }

  subscribe(event, handler) {
    let name = typeof event === "string" ? event : event.name;
    let sugar = function (event) {
      handler(event);
    };
    document.addEventListener(name, sugar);

    return function unsubscribe() {
      document.removeEventListener(name, sugar);
    };
  }

  async onDeleteSuccess(event) {
    try {
      let res = event.detail.res;
      let todoID = +res.url.match(/(?<=\/)\d+/)[0];
      let idx = +this.todos.findIndex(({ id }) => id === todoID);

      this.todos.splice(idx, 1);
      this.createTemplateData();
      this.renderMainTemplate();
    } catch (e) {
      throw e;
    }
  }

  async onResetSuccess(event) {
    this.todos.length = 0;
    this.createTemplateData();
    this.renderMainTemplate();
  }

  async onDelete(event) {
    if (!event.target.matches("td.delete, td.delete img")) return;
    let parentRow = event.target.closest("tr");
    let todo = this.findAssociatedTodo(parentRow.dataset.id);
    this.api.delete(todo.id, JSON.stringify(todo));
  }

  async onCreateSuccess(event) {
    try {
      let res = event.detail.res;
      let todo = await res.json();
      this._addDueDate([todo]);
      this.todos.push(todo);
      document
        .querySelectorAll(".active")
        .forEach((e) => e.classList.remove("active"));
      this.activeList = "All Todos";
      this.createTemplateData();
      this.renderMainTemplate();
    } catch (e) {
      throw e;
    }
  }

  async onUpdateSuccess(event) {
    try {
      let res = event.detail.res;
      let todo = await res.json();
      this._addDueDate([todo]);
      let idx = this.todos.findIndex(({ id }) => id === todo.id);
      this.todos[idx] = todo;
      this.createTemplateData();
      this.renderMainTemplate();
    } catch (e) {
      throw e;
    }
  }

  async onReadSuccess(event) {
    try {
      let res = event.detail.res;
      let todos = await res.json();
      this._addDueDate(todos);
      this.todos = todos;
      this.publish(new CustomEvent("data_ready"));
    } catch (e) {
      throw e;
    }
  }

  createTemplateData() {
    this.sortedTodos = this._sortTodos(this.todos);
    this.templates.data.todos_by_date = this._getTodosByDate();
    this.templates.data.completed = this._getCompletedTodos();
    this.templates.data.completed_todos_by_date =
      this._getCompletedTodosByDate();
    this.templates.data.todos_by_list = this._getTodosByList();
    this.templates.data.active_list_todos = this._getActiveListTodos();
  }

  createTemplates() {
    // Load and register all templates
    let templateSelector = 'script[type="text/x-handlebars"]';
    let allTemplates = document.querySelectorAll(templateSelector);

    allTemplates.forEach((template) => {
      // @ts-ignore
      if (template.dataset.type === "partial") {
        // @ts-ignore
        Handlebars.registerPartial(template.id, template.innerHTML);
      }
      // @ts-ignore
      this.templates[template.id] = Handlebars.compile(template.innerHTML);
    });
  }

  createSeedTodos(count = 10) {
    let todos = [];
    let groupCount = Math.trunc(count / 3);

    for (let i = 1; i <= count; i++) {
      let todo = {
        id: `${i}`,
        title: `todo ${i}`,
        day: i < 4 ? "" : `${i}`.padStart(2, "0"),
        month: i < 4 ? "" : `${Math.ceil(i / groupCount)}`.padStart(2, "0"),
        year: i < 4 ? "" : "2024",
        description: "lorem ipsum dolor sit amet",
        completed: "false",
      };

      todos.push(todo);
    }

    this._addDueDate(todos);

    return todos;
  }

  _addDueDate(todos) {
    todos.forEach((todo) => {
      todo.due_date =
        !todo.month.trim() || !todo.year.trim()
          ? "No Due Date"
          : `${todo.month}/${todo.year.slice(2)}`;
    });
  }

  _getTodosByDate(todos = this.sortedTodos) {
    let unsorted = {};
    todos.forEach((todo) => {
      if (!unsorted[todo.due_date]) {
        unsorted[todo.due_date] = [];
      }
      unsorted[todo.due_date].push(todo);
    });

    return this._sortListsByDate(unsorted);
  }

  _sortListsByDate(unsorted) {
    if (Object.keys(unsorted).length === 0) return unsorted;
    let sorted = {};
    if (unsorted["No Due Date"]) {
      sorted["No Due Date"] = unsorted["No Due Date"];
      delete unsorted["No Due Date"];
    }
    let sortedKeys = Object.keys(unsorted).sort((a, b) => {
      let d1 = new Date(`${a.slice(0, 2)}/01/20${a.slice(3)}`);
      let d2 = new Date(`${b.slice(0, 2)}/01/20${b.slice(3)}`);
      switch (true) {
        case d1 < d2:
          return -1;
        case d1 > d2:
          return 1;
        default:
          return 0;
      }
    });
    sortedKeys.forEach((key) => (sorted[key] = unsorted[key]));
    return sorted;
  }

  handleListClick(event) {
    let sidebar = document.querySelector("div#sidebar");
    if (!sidebar.contains(event.target)) return;

    let clickedList = event.target.closest("[data-title]");
    let activeElements = document.querySelectorAll(".active");
    activeElements.forEach((e) => e.classList.remove("active"));
    clickedList.classList.add("active");
    this.activeList = clickedList.dataset.title;

    let activeListTodos = this._getActiveListTodos();
    let completedLists = document.getElementById("completed_items");
    let isCompletedList = completedLists.contains(event.target);
    if (isCompletedList) {
      activeListTodos = this._getCompletedTodos(activeListTodos);
    }
    let title = this.activeList;
    let data = {
      list_template: { selected: activeListTodos },
      title_template: {
        active_list: {
          title,
          length: activeListTodos.length,
        },
      },
    };

    let listHTML = this.templates.list_template(data.list_template);
    let titleHTML = this.templates.title_template(data.title_template);

    let listContainer = document.querySelector("tbody");
    listContainer.innerHTML = listHTML;

    let titleContainer = document.querySelector("#items header");
    titleContainer.innerHTML = titleHTML;
  }

  _getDoneTodos(todos = []) {
    let done = todos.filter((todo = {}) => todo.completed === true);
    return done;
  }

  _deepCopy(object) {
    return JSON.parse(JSON.stringify(object));
  }

  _getCompletedTodosByDate() {
    let todosByDate = this._deepCopy(this.templates.data.todos_by_date);

    for (let date in todosByDate) {
      let doneTodos = this._getCompletedTodos(todosByDate[date]);
      if (doneTodos.length > 0) {
        todosByDate[date] = doneTodos;
      } else {
        delete todosByDate[date];
      }
    }

    return todosByDate;
  }

  bindListeners() {
    this.listeners.push(
      ["templates_ready", this.onTemplatesReady],
      ["click", this.onClick],
      ["click", this.onSave],
      ["click", this.onDelete],
      ["read_success", this.onReadSuccess],
      ["update_success", this.onUpdateSuccess],
      ["create_success", this.onCreateSuccess],
      ["delete_success", this.onDeleteSuccess],
      ["reset_success", this.onResetSuccess]
    );
    this.listeners.forEach(([ev, fn]) => {
      this.subscribe(ev, fn.bind(this));
    });
  }

  handleTodoClick(event) {
    event.preventDefault();
    let targetIsTodo = event.target.matches(
      "main label, " +
        'main label[for= "new_item"] h2, ' +
        'main label[for= "new_item"] img'
    );
    let callback;
    if (targetIsTodo) {
      if (!this.isNewItem(event)) {
        callback = () => {
          this.populateTodoAttrs(event);
          this.setToggleCompleteButton();
        };
      }
      this.showModal(callback);
    }
  }

  handleModalLayerClick(event) {
    if (event.target === this.modalLayer) this.hideModal();
  }

  onClick(event) {
    event.preventDefault();
    this.handleCheck(event);
    this.handleTodoClick(event);
    this.handleModalLayerClick(event);
    this.handleListClick(event);
  }

  resetInputs(event) {
    let todo = this.findAssociatedTodo(event.target.htmlFor);
    // @ts-ignore
    this.form.completed.value = `${todo.completed}`;
    // @ts-ignore
    this.form.todo_id.value = todo.id;
  }

  findAssociatedTodo(textContaingTodoID) {
    let todoID = +textContaingTodoID.match(/\d+/)[0];
    return this._deepCopy(this.todos.find(({ id }) => id === todoID));
  }

  populateTodoAttrs(event) {
    this.resetInputs(event);
    let todo = this.findAssociatedTodo(event.target.htmlFor);
    // @ts-ignore
    for (let input of this.form.elements) {
      let attr = todo[input.name];
      if (typeof attr === "string") attr = attr.trim();
      if (attr) input.value = attr;
    }
  }

  setToggleCompleteButton() {
    let form = this.form;
    // @ts-ignore
    let todoID = +form.todo_id.value;
    // @ts-ignore
    let btn = form.complete_btn;
    let todo = this.todos.find(({ id }) => id === todoID);
    let completed = todo.completed;

    let completeMsg = "Mark Complete";
    let incompleteMsg = "Mark Incomplete";

    if (!todoID) {
      btn.textContent = completeMsg;
    } else if (completed) {
      btn.textContent = incompleteMsg;
    } else {
      btn.textContent = completeMsg;
    }
  }

  onToggleComplete(event) {
    // @ts-ignore
    let completeBtn = this.form.complete_btn;
    if (event.target !== completeBtn) return;
    // @ts-ignore
    let completedInput = this.form.completed;
    // @ts-ignore

    let todo = this.todos.find(({ id }) => id === +this.form.todo_id.value);
    todo.completed = !todo.completed;
    completedInput.value = `${todo.completed}`;
    this.api.update(todo.id, JSON.stringify(todo));
  }

  isNewItem(event) {
    let label = event.target.closest("label");
    return label.htmlFor === "new_item";
  }

  static TodoFields = new Set([
    "title",
    "day",
    "month",
    "year",
    "description",
    "id",
    "completed",
  ]);

  formToObject(form) {
    let todo = {};
    for (let element of form.elements) {
      let { value, name } = element;
      // Set values for Year, Month, Day dropdowns to an empty string of the
      // length defined by that fields specific validation rules. E.g. Year
      // needs to 4 characters long. This is done so that the front-end
      // can reset fields to their default values without the server
      // complaining
      if (value?.toLowerCase() === name) {
        if (name === "year") {
          value = "    ";
        } else {
          value = "  ";
        }
      }
      if (name === "id") value = +value;
      if (name === "description" && value.trim() === "") {
        value = " ";
      }

      // Only set a value on the todo if it comes from a legitimate todo field
      if (App.TodoFields.has(name)) todo[name] = value;
    }
    return todo;
  }

  formInputsValid(todo, detail) {
    this.validateFormFields(todo, detail);
    return this.validationMessages.length === 0;
  }

  validationMethods(method) {
    let methods = {
      length: (todo, field, minLength) => {
        let length = todo[field].length;
        let required = field === "title" ? true : false;
        let invalid =
          (required && length < minLength) ||
          (length > 0 && length < minLength);
        if (invalid) {
          this.validationMessages.push(
            `Error: A todo ${field} must be at least ${minLength} characters long.`
          );
        }
      },
      date: (todo, field, value) => {
        if (todo?.year?.trim() === "") return;

        let today = value;
        let month = todo["month"]?.trim() || new Date().getMonth() + 2;
        let year = todo["year"];
        let day = todo["day"]?.trim() || new Date().getDate();
        let todoDate = new Date(`${month}/${day}/${year}`);

        if (todoDate < today) {
          this.validationMessages.push(
            `Error: The date you entered is in the past. The day, month, and year values for a todo must not represent a date in the past.`
          );
        }
      },
      unique: (todo, field, value) => {
        let todoCompleted =
          typeof todo.completed === "string"
            ? todo.completed === "true"
            : todo.completed === true;
        let duplicate = this.todos.find((dup) => {
          return (
            dup[field] === value &&
            todo.id !== dup.id &&
            todoCompleted === dup.completed
          );
        });
        if (duplicate) {
          this.validationMessages.push(
            `Error: You must enter a ${field} that is unique. Another todo exists with the ${field} "${value}" and the same "completed" value. Todos can only have the same title when they have different values for their "completed" attribute.`
          );
        }
      },
    };
    return methods[method];
  }

  getDate() {
    return new Date(new Date().setHours(0, 0, 0, 0));
  }

  validateFormFields(todo, detail) {
    let validationCriteria = {
      title: { length: 3, unique: todo.title },
      day: { length: 2 },
      month: { length: 2 },
      year: { length: 4 },
      completed: { length: 4 },
      description: { length: 1 },
      date: { date: this.getDate() },
    };

    for (let field in validationCriteria) {
      if (detail && !detail[field]) continue;
      if (todo[field]?.trim() === "" && field !== "title") continue;
      let criteria = validationCriteria[field];

      for (let attr in criteria) {
        if (detail && detail[field] !== attr) continue;
        let value = criteria[attr];
        this.validationMethods(attr)(todo, field, value);
      }
    }
  }

  alertInvalid() {
    this.validationMessages.forEach((msg) => alert(msg));
    this.validationMessages = [];
  }

  async handleCheck(event) {
    try {
      let selector = "span.check, td.list_item";
      let isMatch = event.target.matches(selector);

      if (isMatch) {
        let checkInput =
          event.target.parentElement.querySelector('[type="checkbox"]');
        let todo = this.findAssociatedTodo(checkInput.name);
        todo.completed = !todo.completed;
        if (!this.formInputsValid(todo, { title: "unique" })) {
          this.alertInvalid();
          return;
        }
        this.api.update(todo.id, JSON.stringify(todo));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  async onSave(event) {
    event.preventDefault();
    // @ts-ignore
    let { save, complete } = this.form;

    if (![save, complete].includes(event.target)) return;

    let formTodo = this.formToObject(this.form);
    let curTodo = this._deepCopy(
      this.todos.find(({ id }) => id === +formTodo.id) ?? {}
    );

    if (complete === event.target) {
      curTodo.completed = !curTodo.completed;
      if (!formTodo.id) {
        alert("Cannot mark as complete as item has not been created yet!");
        return;
      } else if (!this.formInputsValid(curTodo, { title: "unique" })) {
        this.alertInvalid();
        return;
      }
      this.onToggleComplete(event);
      return;
    }

    if (!this.formInputsValid(formTodo)) {
      this.alertInvalid();
      return;
    }

    if (!formTodo.id) {
      this.api.create(JSON.stringify(formTodo));
    } else {
      this.api.update(formTodo.id, JSON.stringify(formTodo));
    }
  }

  showModal(callback = () => {}) {
    this.resetModal();
    callback();
    this.modalElements.forEach((e) => e.classList.replace("hide", "show"));
  }

  resetModal() {
    // @ts-ignore
    this.form.reset();
  }

  hideModal() {
    // @ts-ignore
    this.modalElements.forEach((e) => e.classList.replace("show", "hide"));
  }

  _getCompletedTodos(todos = this.sortedTodos) {
    return todos.filter((todo = {}) => todo.completed === true);
  }

  _sortTodos(list = this.todos) {
    let incomplete = list.filter((todo = {}) => todo.completed === false);
    let complete = list.filter((todo = {}) => todo.completed === true);
    return [...incomplete, ...complete];
  }

  _getTodosByList() {
    let todosByDate = this.templates.data.todos_by_date;
    let completedTodos = this.templates.data.completed;
    // {Completed: {todos: this._getCompletedTodos()}};
    let todosByList = Object.assign(
      {
        "All Todos": this.sortedTodos,
        Completed: completedTodos,
      },
      todosByDate
    );

    return todosByList;
  }

  _getActiveListTodos() {
    let todosByList = this.templates.data.todos_by_list;
    return todosByList[this.activeList] ?? [];
  }

  completed_todos_template_data() {
    let activeElement = document.querySelector(".active");
    let data = { completed: this.templates.data.completed };
    if (activeElement?.matches('[data-title="Completed"]')) {
      data.completed.active = true;
    }
    return data;
  }

  completed_list_template_data() {
    let completed_todos_by_date = this.templates.data.completed_todos_by_date;
    let activeElement = document.querySelector(".active");
    let completedList = document.querySelector("#completed_items");
    let activeListComplete = completedList?.contains(activeElement);

    for (let date in completed_todos_by_date) {
      if (date === this.activeList && activeListComplete) {
        completed_todos_by_date[date].active = true;
      }
    }
    return { completed_todos_by_date };
  }

  title_template_data() {
    let activeTodos = this.templates.data.active_list_todos;
    let activeElement = document.querySelector(".active");
    let completedList = document.querySelector("#completed_items");
    let activeListComplete = completedList?.contains(activeElement);
    if (activeListComplete) {
      activeTodos = this._getCompletedTodos(activeTodos);
    }
    let title = this.activeList;
    let length = activeTodos.length;
    let data = { active_list: { title, length } };
    return data;
  }

  list_template_data() {
    let activeListTodos = this.templates.data.active_list_todos;
    let activeElement = document.querySelector(".active");
    let completedList = document.querySelector("#completed_items");
    let activeListComplete = completedList?.contains(activeElement);
    if (activeListComplete) {
      activeListTodos = this._getCompletedTodos(activeListTodos);
    }
    return { selected: activeListTodos };
  }

  all_list_template_data() {
    let formatted = {};
    let todos_by_date = this.templates.data.todos_by_date;
    let activeElement = document.querySelector(".active");
    let completedList = document.querySelector("#completed_items");
    let activeListComplete = completedList?.contains(activeElement);

    for (let date in todos_by_date) {
      let todos = todos_by_date[date];
      formatted[date] = { todos };
      if (date === this.activeList && !activeListComplete) {
        formatted[date].active = true;
      }
    }
    return { todos_by_date: formatted };
  }

  all_todos_template_data() {
    let data = { length: this.todos.length };

    if (this.activeList === "All Todos") {
      data.active = true;
    }
    return { all_todos: data };
  }

  _getActiveListData() {
    let activeListTodos = this._getActiveListTodos();
    return {
      title: this.activeList,
      data: activeListTodos.todos.length,
      todos: activeListTodos.todos,
    };
  }

  _getMainTemplateData(todos = this.todos) {
    let templateData = {};
    Object.assign(
      templateData,
      this.all_todos_template_data(),
      this.all_list_template_data(),
      this.completed_todos_template_data(),
      this.completed_list_template_data(),
      this.title_template_data(),
      this.list_template_data()
    );
    return templateData;
  }

  renderMainTemplate() {
    let data = this._getMainTemplateData();
    let activeItem = document.querySelector(".active");
    // @ts-ignore
    this.activeList = activeItem ? activeItem.dataset.title : "All Todos";
    let newHTML = this.templates.main_template(data);
    document.body.innerHTML = newHTML;
    this.form = document.querySelector("#form_modal form");
    this.modalLayer = document.getElementById("modal_layer");
    this.modalElements = document.querySelectorAll(".modal");
  }
}

let app = new App();
