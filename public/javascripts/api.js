class API {
  constructor() {}

  async create(body) {
    let url = `/api/todos`;
    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    let successEvent = "create_success";
    let failEvent = "create_fail";
    let args = { body, url, options, successEvent, failEvent };
    return this.sendRequest(args);
  }

  async read(id, body) {
    let url = `/api/todos${id ? `/${id}` : ""}`;
    let options = {
      method: "GET",
    };
    let successEvent = "read_success";
    let failEvent = "read_fail";
    let args = { id, body, url, options, successEvent, failEvent };
    return this.sendRequest(args);
  }

  async update(id, body) {
    let url = `/api/todos/${id}`;
    let options = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    };
    let successEvent = "update_success";
    let failEvent = "update_fail";
    let args = { id, body, url, options, successEvent, failEvent };
    return this.sendRequest(args);
  }

  async delete(id, body) {
    let url = `/api/todos/${id}`;
    let options = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    };
    let successEvent = "delete_success";
    let failEvent = "delete_fail";
    let args = { body, url, options, successEvent, failEvent };
    return this.sendRequest(args);
  }

  async reset() {
    let url = "/api/reset";
    let options = {
      method: "GET",
    };
    let successEvent = "reset_success";
    let failEvent = "reset_fail";
    let args = { body: null, url, options, successEvent, failEvent };
    return this.sendRequest(args);
  }

  async sendRequest({ body, url, options, successEvent, failEvent }) {
    try {
      if (body) options.body = body;
      let res = await fetch(url, options);
      return res.ok
        ? this.onSuccess(res, successEvent)
        : this.onFail(res, failEvent);
    } catch (error) {
      return this.onError(error);
    }
  }

  publish(event) {
    document.dispatchEvent(event);
  }

  async onSuccess(res, eventName) {
    this.publish(new CustomEvent(eventName, { detail: { res } }));
    return res;
  }

  static ERRORS = {
    requestFail: (res) =>
      `Request fail.\nHTTP Status: ${res.status}\nHTTP Status Text: ${res.statusText}`,
  };

  onFail(res, eventName) {
    console.warn(API.ERRORS.requestFail(res));
    this.publish(new CustomEvent(eventName, { detail: { res } }));
    return res;
  }

  onError(error) {
    throw error;
  }
}
