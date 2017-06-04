// ==UserScript==
// @name        Duolingo Course Switcher
// @description Simplifies switching between courses that use different interface language (i.e., base language, the language from which you learn).
// @namespace   http://moviemap.me/duoinc
// @include     https://www.duolingo.com/*
// @downloadURL https://github.com/arekolek/DuolingoCourseSwitcher/raw/master/duolingo-course-switcher.user.js
// @updateURL   https://github.com/arekolek/DuolingoCourseSwitcher/raw/master/duolingo-course-switcher.user.js
// @version     0.8.2
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @author      arekolek, mofman, gmelikov, christeefury, guillaumebrunerie
// ==/UserScript==

var duo = unsafeWindow.duo;
var _   = unsafeWindow._;

document.head.appendChild($('<style type="text/css">'+
    '.language-sub-courses {position:absolute; top:-28px !important; color:#000; background-color: #fff; min-width: 150px; min-height: 50px; display: none !important;}'+
    'html[dir="ltr"] .language-sub-courses {left:200px !important;}'+
    'html[dir="rtl"] .language-sub-courses {right:200px !important;}'+
    '</style>').get(0));

var header1 = JSON.parse('{"dn": "van", "sv": "fr\\u00e5n", "fr": "de", "hu": "-b\\u00f3l", "eo": "de", "tr": "-den", "es": "desde", "ro": "din", "ja": "\\u304b\\u3089", "vi": "t\\u1eeb", "it": "da", "he": "\\u05de", "el": "\\u03b1\\u03c0\\u03cc", "ru": "\\u0441", "ar": "\\u0645\\u0646", "en": "from", "ga": "\\u00f3", "cs": "od", "pt": "de", "de": "von", "zs": "\\u5f9e", "pl": "z"}');

function switchCourse(from, to) {
    $.post('/api/1/me/switch_language', {
            from_language: from,
            learning_language: to
        },
        function (data) {
            location.reload();
        }
    );
}

function updateCourses(A) {
    if(localStorage.getItem('dcs_courses') && !GM_getValue('dcs_courses')){
      // switch to greasemonkey storage
      GM_setValue('dcs_courses', localStorage.getItem('dcs_courses'));
    }
    var courses = JSON.parse(GM_getValue('dcs_courses', '{}'));
    var learning = [].filter.call(A.languages, function(lang){ return lang.learning; });
    courses[A.ui_language] = learning.map(function(lang){ return _(lang).pick('language', 'level'); });
    try {
        GM_deleteValue('dcs_courses');
    }
    finally {
        GM_setValue('dcs_courses', JSON.stringify(courses));
    }
    return courses;
}

function sortList() {
    var listitems = $('.languages > .language-choice').get();
    listitems.sort(function(a, b) { return $(b).find('li.language-choice').size() - $(a).find('li.language-choice').size(); });
    $.each(listitems, function(idx, itm) { $(itm).insertBefore('.languages > .divider'); });
}

$(document).on({
    mouseenter: function() {
        // Do nothing if we've already updated it
        if($('ul.languages ul').size() > 0)
            return;

        // Get and update languages in local storage
        var A = duo.user.attributes;
        var courses = updateCourses(A);

        // Do nothing if there's only one base language
        if(Object.keys(courses).length < 2)
            return;

        // I'm not sure why this can't be invoked in top level.
        $('#topbar').on('click', '.extra-choice', function(){
            var from = $(this).attr('data-from');
            var to = $(this).attr('data-to');
            switchCourse(from, to);
        });

        // Get localized strings
        var languageNames = duo.language_names_ui[A.ui_language];
        var levelLabel = $('.languages .gray').first().text().split(' ')[0]+' ';

        // Remove the current list
        $('.languages > .language-choice').remove();

        // Change top-level heading
        var header2 = $('.languages > .head > h6').text();
        $('.languages > .head > h6').text(header1[A.ui_language] || 'From');

        // Create top-level list using source languages
        $.each(courses, function( from, value ) {
            fromCourse = '<li class="language-choice choice"><a href="javascript:;"><span class="flag flag-svg-micro flag-'+from+'"></span><span>'+languageNames[from]+'</span></a><ul class="dropdown-menu language-sub-courses '+from+'"><li class="head"><h6>'+header2+'</h6></li></ul></li>';

            fromCourse = $(fromCourse).insertBefore('.languages > .divider');

            value.sort(function(a, b) { return b.level - a.level; });
            $.each(value, function( fromx, v ) {
                to = v.language;
                sub = $('<li class="language-choice extra-choice" data-from="'+from+'" data-to="'+to+'"><a href="javascript:;"><span class="flag flag-svg-micro flag-'+to+'"></span><span>'+languageNames[to]+'</span> <span class="gray">'+levelLabel+v.level+'</span></a></li>');
                sub.appendTo('ul.'+from);
                if(from == A.ui_language && to == A.learning_language) {
                    sub.addClass('active');
                }
            });

            if(from == A.ui_language) {
                fromCourse.addClass('active');
            }
        });

        sortList();
    }
}, '.dropdown.topbar-language');

$(document).on({
    mouseenter: function () {
        $(this).children('.language-sub-courses').attr('style', 'display: block !important');
    },
    mouseleave: function () {
        $(this).children('.language-sub-courses').attr('style', 'display: none !important');
    }
}, '.choice');

