// form.js

document.addEventListener('DOMContentLoaded', function () {
  var dateElems = document.querySelectorAll('.datepicker');
  M.Datepicker.init(dateElems);

  var timeElems = document.querySelectorAll('.timepicker');
  M.Timepicker.init(timeElems);
});