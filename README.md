# Take Home Assessment: Todo Web App

This repository contains a simple Todo app that was created to pass a take-home assessment for the DOM & Asynchronous JavaScript course at Launch School.

This is one of the last, and toughest courses in Launch School. The assessment specifically tested our ability to create client-side JavaScript and HTML code that satisfies a large list of requirements and leverages the DOM API, a templating library (Handlebars), and a prebuilt CRUD backend API to create a responsive todo app. The code I wrote lives in the `public/javascripts` directory and at `public/index.html`.<br><br>

## Installation

- Clone the repository.
- In a terminal `cd` into the project directory and run `npm install`.
- Once you've installed the dependencies, run `npm start`
- Ensure your `node` and `postgresql` versions meet the minimum required version above.<br><br>

## Reference

To see the API Docs start the web server for the project and visit http://localhost:3000/doc/.<br><br>

## Rules / Requirements

Below are the rules and requirements for the code I wrote. I met all requirements and passed the assessment with high marks.<br>

### Main Area

- All the CRUD operations for the todos should happen first on the server and then on the front-end. Don't update the DOM before any associated server request receives a successful response.

- Consider how you organize your code. Leverage object oriented design patterns where appropriate.

- Invest time in planning out and understanding the requirements/ specifications (recall the PEDAC process).

- Time limit for this is 72 hours.

- Clicking on "Add new to do" shows the modal.

- At all times the app displays the current selected "todo group" with the corresponding count of todos.

- Hovering on a todo item highlights the todo. Clicking on the area surrounding the todo name toggles the todo state (complete/not complete).

- The todo name displayed on the todo list is of the following form - "{title} - {month}/{year}" (i.e., Item 1 - 02/15). If the todo doesn't have both a month and year, the todo name displayed is of the form "{title} - No Due Date".

- Clicking a todo shows the modal with the corresponding todo details.

- Hovering on the trash bin area highlights it.

- Clicking on the trash bin or its surrounding area deletes the todo both on the server and in the browser.

- Completed todos should be on the bottom of the list.

### Nav Area

- Clicking on a "todo group" selects it and updates the content on the main area accordingly.

- When a todo is toggled/deleted the currently selected todo group should not change. The todos in the main area should reflect what is currently selected, and the corresponding count of todos should reflect the count accordingly.

- The nav area lists all the available "todo groups." There are two major group listings: (1) All Todos and (2) Completed.

- The todo groups are sorted by date in ascending order, with the "No Due Date" group coming first on the list.

- The corresponding count of "todo items" for the respective "todo group" is displayed.

### Modal

- The modal displays the appropriate content.

- When adding a new item, the fields should be empty with placeholder texts.

- When clicking on an existing item, the fields should contain the todo detail where available.

- Clicking "Save" closes the modal.

- When adding a new item, it selects the "All Todos" group from the nav area.

- When clicking on an existing item, it retains the currently selected group.

- All created/updated todos are listed under "No Due Date" unless it contains data for both the month and year fields.

- The Modal allows resetting a todo's details back to their default values. As an example, a user could move a todo with a date of 02/23 to the "No Due Date" category by resetting its month and year fields.

- The modal saves the details that were provided accordingly.

- When clicking "Mark As Complete":

  - When adding a new item, it alerts the user that it can not be done.
  - When clicking on an existing item, it marks the todo as completed.

- Clicking anywhere outside the modal closes it.
