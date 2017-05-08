;(function () {
  'use strict';
  var $form_add_task = $('.add-task'),
      new_task = {},
      task_list = null,
      $delete_task_trigger,
      $detail_task_trigger,
      $task_detail_mask,
      $task_detail,
      $detail_form,
      $task_item,
      $checkbox,
      $notify = $('.notify'),
      $alerter = $('.alert-music'),
      $my_alert = $('.my-alert'),
      $alert_mask = $('.alert-mask'),
      $yes_delete = $('.yes-delete'),
      $no_delete = $('.no-delete');

  init_task();

  /**这里放的是html里面写好的标签元素的事件 */
  $form_add_task.on('submit', function (e) { //如果添加了新的属性这里的new_task也要添加一条新的属性
    var input_content,
        result;
    // 禁用默认行为
    e.preventDefault();
    // 获取Task的值
    input_content = $(this).find('input[name=content]');
    new_task.content = input_content.val();
    new_task.description = "";
    new_task.date = "";
    new_task.complete = false;
    new_task.has_reminded = false;
    // 如果Task输入的值为空就直接返回否则继续执行
    if (!new_task.content) return;
    // 存入新的Task
    add_task(new_task);
    // if (result) {
    //   render_task_list();
    // }
    new_task = {};//必须要重新创建一个对象，对象是引用类型，数组保存对象只会保存对象的引用值
    input_content.val(null);
  });

  function my_alerter (msg) { //自定义alert
    var dfd = $.Deferred();
    var $cnt_div = $('.alert-content');
    var timer,
        confirmed;
    $cnt_div.html(msg);
    $my_alert.show();
    $alert_mask.show();
    timer = setInterval(function () {
      if (confirmed !== undefined) {
        dfd.resolve(confirmed);
        clearInterval(timer);
        $my_alert.hide();
        $alert_mask.hide();
      }
    }, 50);
    $yes_delete.on('click', function (e) {
      confirmed = true;
    });
    $no_delete.on('click', function (e) {
      confirmed = false;
    });
    return dfd.promise();
  }

  //查找并监听所有任务列表的删除点击事件
  function add_item_listen () {
    $delete_task_trigger.on('click', function (e) {
      var $this = $(this);
      var $item = $this.parent().parent();
      var index = $item.data('index');
      // var tmp = confirm("确认删除吗？");
      // tmp ? delete_task(index) : null;
      my_alerter('确定要删除吗？').then(function (result) {
        result ? delete_task(index) : null;
      });
    });
    $detail_task_trigger.on('click', function (e) {
      var $this = $(this);
      var $item = $this.parent().parent();
      var index = $item.data('index');
      flash_task_detail(index);
      $task_detail_mask.fadeIn();
      $task_detail.fadeIn();
    });
    $task_detail_mask.on('click', function (e) {
      $task_detail_mask.fadeOut();
      $task_detail.fadeOut();
    });
    $task_item.on('dblclick', function (e) {
      var $this = $(this);
      var index = $this.data('index');
      flash_task_detail(index);
      $task_detail_mask.fadeIn();
      $task_detail.fadeIn();
    });
    $checkbox.on('dblclick', function (e) {
      e.stopPropagation();
    });
    $checkbox.on('click', function (e) {
      var $this = $(this);
      var index = $this.parent().parent().data('index');
      var judge = $this.is(':checked');
      var moveElement;
      task_list[index].complete = judge;
      if (judge) {
        moveElement = task_list.splice(index, 1);
        task_list.push(moveElement[0]);
      }else {
        moveElement = task_list.splice(index, 1);
        task_list.unshift(moveElement[0]);
      }
      reflash_localStroage();
      init_task();
    });
  }

  function flash_task_detail (index) { //任务详情列表  
    var item = task_list[index];
    if (index === undefined || !task_list[index]) return;
    var tpl = 
      '<div name="detail-form-div">' +
        '<form>'+  
          '<div class="content" name="callback-content">' +
            item.content +
          '</div>' +
          '<input style="display:none;" type="text" name="content-in-detail" autocomplete="off" value="' + item.content +'">' +
          '<div>' +
            '<div class="description">' +
              '<textarea name="get-textarea" rows="10" cols="30" placeholder="在这里填入你的任务详情~">' + item.description + '</textarea>' +
            '</div>' +
          '</div>' +
          '<div class="remind">' +
            '<label>提醒时间：</label>' +
            '<input class="data-picker" type="text" value="' + item.date +'">' +
            '<button type="submit" class="detail-button">更新</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    $('.task-detail').html(tpl);
    //要在html()写入后再取
    var $get_textarea = $('[name="get-textarea"]');
    var $get_date = $('.remind input');
    var $input = $('[name="content-in-detail"]');
    var $detail_content = $('[name="callback-content"]');
    var $data_picker = $('.data-picker');
    $data_picker.datetimepicker();
    $detail_form = $('[name="detail-form-div"]');
    $detail_form.on('submit', function (e) { //如果添加了新的属性这里的dataObj也要添加一条新的属性
      e.preventDefault();
      var dataObj = {};
      var val = $get_textarea.val();
      dataObj.description = val;
      dataObj.content = $input.val();
      dataObj.date = $get_date.val();
      dataObj.complete = item.complete;
      dataObj.has_reminded = false;
      updata_content(index, dataObj);
      $task_detail_mask.fadeOut();
      $task_detail.fadeOut();
    });
    $detail_content.on('dblclick', function (e) {
      $detail_content.hide();
      $input.show();
      $input.focus();
    });
    $input.on('blur', function (e) {
      $detail_content.html($input.val());
      $detail_content.show();
      $input.hide();
    });
    /**不能在on blur的事件更改has_reminded因为更改的不是新提交时间的has_reminded 要在on submit事件更改*/
    // $data_picker.on('blur', function (e) {
    //   item.has_reminded = false;
    //   reflash_localStroage();
    // });
  }

  function updata_content (index, dataObj) {
    var item_html = "";
    if (task_list[index]===undefined) return;
    task_list.splice(index, 1, dataObj); //替换数组中的值不能直接arr[index] = 值; 这样修改
    reflash_localStroage();
    init_task();
  }
  
  function add_task (new_task) {
    task_list.unshift(new_task);
    // console.log("test1", task_list);
    //更新localStorage
    reflash_localStroage();
    init_task();
    // return true;
  }

  function reflash_localStroage () { //更新localStorage
    window.localStorage.setItem("task_list", JSON.stringify(task_list)); //localStorage.setItem方法要用JSON数据格式储存因为直接储存会丢失数据的类型
    // window.localStorage.setItem("task_list", task_list);
  }

  function init_task () { //重新刷新主页面
    task_list = JSON.parse(window.localStorage.getItem("task_list") || '[]');  //localStorage.getItem方法提起之后要解析字符串成原来的代码
    // task_list = window.localStorage.getItem("task_list") || [];
    // console.log("test", task_list);
    var item_html = "";
    //开始添加代码渲染localStorage里面的值
    for (var i=0, len=task_list.length; i<len; i++) {
      item_html += 
        '<div class="task-item' + (task_list[i].complete ? " complete" : "") + '" data-index="' + i + '">' +
          '<span><input type="checkbox" ' + (task_list[i].complete ? "checked='checked'" : "") + '></span>' +
          '<span class="task-content">' + task_list[i].content + '</span>' +
          '<span class="float-right">'+
            '<span class="action delete"> 删除</span>' + 
            '<span class="action detail"> 详情</span>'+
          '</span>'+
        '</div>';
    }
    // console.log("item_html", item_html);
    $('.task-list').html(item_html);
    $delete_task_trigger = $('.action.delete'); //渲染完成后找到每个class等于action和delete的span标签
    $detail_task_trigger = $('.action.detail');
    $task_detail_mask = $('.task-detail-mask');
    $task_detail = $('.task-detail');
    $task_item = $('.task-item');
    $checkbox = $('input[type="checkbox"]');
    add_item_listen(); //添加点击事件
    task_remind_check();   
  }

  function task_remind_check () {
    var current_timestamp,
        item,
        intId,
        item_timestamp,
        intId;
    intId = setInterval(function () {
      for (var i=0, len=task_list.length; i<len; i++) {
        item = task_list[i];
        if (!item.complete && item.date && !item.has_reminded) {
          current_timestamp = (new Date()).getTime();
          item_timestamp = (new Date(item.date)).getTime();
          // console.log('current_timestamp', current_timestamp);
          // console.log('item_timestamp', item_timestamp);
          if (current_timestamp - item_timestamp >= 1) {
            notify(item.content, item);
          }
        }
      }
    }, 300);
  }

  function notify (content, item) {
    item.has_reminded = true;
    reflash_localStroage();
    $alerter.get(0).play();
    $notify.fadeIn();
    var htmltpl =
      "时间到啦！" +
      '<div class="notify-content">' + content + '</div>' + 
      '<button type="button" class="know">知道啦</button>';
    $notify.html(htmltpl);
    var $know = $('.know');
    $know.on('click', function (e) {
      $notify.fadeOut();
      // item.has_reminded = true; //不能写在onClick事件里面因为这样就会一直执行setInterval方法
      // reflash_localStroage();
    });
    // console.log("时间到");
  }

  //删除一条task
  function delete_task (index) {
    //如果没有传递index或者index在task_list里面不存在就直接返回
    if (index<0 || !task_list[index]) return;
    task_list.splice(index, 1);
    //更新localStorage 
    reflash_localStroage();
    init_task(); 
  }

/**
 * 这段代码是为了在页面已经给用户使用但是又有对象有新的属性要加入，好维护些
 */
  // add_property("has_reminded", false);

  // function add_property (property, value) {
  //   for (var i=0, len=task_list.length; i<len; i++) {
  //     var item = task_list[i];
  //     if (!item[property]) {
  //       item[property] = value;
  //     }
  //   }
  //   reflash_localStroage();
  // }
/**
 * 这段代码是为了在页面已经给用户使用但是又有对象有新的属性要加入，好维护些
 */
})();