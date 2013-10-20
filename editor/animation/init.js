//Dont change it
requirejs(['ext_editor_1', 'jquery_190', 'raphael_210'],
    function (ext, $, TableComponent) {

        var cur_slide = {};

        ext.set_start_game(function (this_e) {
        });

        ext.set_process_in(function (this_e, data) {
            cur_slide["in"] = data[0];
        });

        ext.set_process_out(function (this_e, data) {
            cur_slide["out"] = data[0];
        });

        ext.set_process_ext(function (this_e, data) {
            cur_slide.ext = data;
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_process_err(function (this_e, data) {
            cur_slide['error'] = data[0];
            this_e.addAnimationSlide(cur_slide);
            cur_slide = {};
        });

        ext.set_animate_success_slide(function (this_e, options) {
            var $h = $(this_e.setHtmlSlide('<div class="animation-success"><div></div></div>'));
            this_e.setAnimationHeight(115);
        });

        ext.set_animate_slide(function (this_e, data, options) {
            var $content = $(this_e.setHtmlSlide(ext.get_template('animation'))).find('.animation-content');
            if (!data) {
                console.log("data is undefined");
                return false;
            }

            var checkioInput = data.in;

            if (data.error) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');
                $content.find('.output').html(data.error.replace(/\n/g, ","));

                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
                $content.find('.answer').remove();
                $content.find('.explanation').remove();
                this_e.setAnimationHeight($content.height() + 60);
                return false;
            }

            var rightResult = data.ext["answer"];
            var userResult = data.out;
            var result = data.ext["result"];
            var route = data.ext["route"];
            var result_text = data.ext["result_text"];


            //if you need additional info from tests (if exists)
            var explanation = data.ext["explanation"];

            $content.find('.output').html('&nbsp;Your result:&nbsp;' + JSON.stringify(userResult));
            $content.find('.answer').html(result_text);

            if (!result) {
                $content.find('.call').html('Fail: checkio(' + JSON.stringify(checkioInput) + ')');

                $content.find('.answer').addClass('error');
                $content.find('.output').addClass('error');
                $content.find('.call').addClass('error');
            }
            else {
                $content.find('.call').html('Pass: checkio(' + JSON.stringify(checkioInput) + ')');
            }
            //Dont change the code before it

            var canvas = new SnakeCanvas();
            canvas.createCanvas($content.find(".explanation")[0], checkioInput);
            canvas.animateCanvas(route);

            this_e.setAnimationHeight($content.height() + 60);

        });

        function SnakeCanvas() {
            var format = Raphael.format;

            var colorDark = "#294270";
            var colorAlmostDark = "#0070AB";
            var colorOrange = "#F0801A";
            var colorBlue = "#6BA3CF";
            var colorLightBlue = "#69B3E3";
            var colorWhite = "#FFFFFF";

            var delay = 300;
            var stepDelay = delay * 1.1;

            var zx = 30;
            var cellN = 10;
            var cellSize = 30;
            var fullSize = zx * 2 + cellN * cellSize;

            var attrOuter = {"stroke-width": 2, "stroke": colorDark};
            var attrInner = {"stroke-width": 1, "stroke": colorBlue};
            var attrTree = {"stroke-width": 1, "stroke": colorDark, "fill": colorDark};
            var attrCherry = {"stroke": colorOrange, "fill": colorOrange};
            var attrSnake = {"stroke": colorAlmostDark, "stroke-width": 13,
                "stroke-linecap": "round", "stroke-linejoin": "round",
                "arrow-end": "diamond-narrow-short"};

            var paper;
            var cellSet;
            var TREE = "M5,13 L15,2 L25,13 L22,14 L28,22 L19,23 L19,28 L11,28 L11,23 L2,22 L8,14 z";
            var snake = [];
            var canvasSnake;
            var gMap;

            function snakePath(sn) {
                var tail = sn.length - 1;
                var p = format("M{0},{1}",
                    sn[tail][1] * cellSize + zx + cellSize / 2,
                    sn[tail][0] * cellSize + zx + cellSize / 2
                );
                for (var i = tail - 1; i >= 0; i--) {
                    p += format("L{0},{1}",
                        sn[i][1] * cellSize + zx + cellSize / 2,
                        sn[i][0] * cellSize + zx + cellSize / 2
                    );
                }
//                p += "Z";
                return p;
            }


            this.createCanvas = function (dom, map) {
                gMap = map;
                paper = Raphael(dom, fullSize, fullSize, 0, 0);
                cellSet = paper.set();
                paper.rect(zx, zx, cellSize * cellN, cellSize * cellN).attr(attrOuter);
                for (var i = 1; i < cellN; i++) {
                    paper.path(Raphael.format("M{0},{2}L{1},{2}Z",
                        zx, zx + cellSize * cellN, zx + cellSize * i
                    )).attr(attrInner);
                    paper.path(Raphael.format("M{0},{1}L{0},{2}Z",
                        zx + cellSize * i, zx, zx + cellSize * cellN
                    )).attr(attrInner);
                }
                for (i = 0; i < map.length; i++) {
                    for (var j = 0; j < map[0].length; j++) {
                        if (map[i][j] === 'T') {
                            cellSet[i * cellN + j] = paper.path(TREE).transform(
                                "t" + (zx + cellSize * j) + "," +
                                    (zx + cellSize * i)).attr(attrTree);
                        }
                        else if (map[i][j] === 'C') {
                            cellSet[i * cellN + j] = paper.circle(
                                zx + cellSize * j + cellSize / 2,
                                zx + cellSize * i + cellSize / 2,
                                cellSize / 2 - 6
                            ).attr(attrCherry);
                        }
                        else if (parseInt(map[i][j]) === 0) {
                            snake[0] = [i, j];
                        }
                        else if (parseInt(map[i][j])) {
                            snake[parseInt(map[i][j])] = [i, j];
                        }
                    }
                }
                canvasSnake = paper.path(snakePath(snake)).attr(attrSnake);
            };

            this.animateCanvas = function (route) {
                for (var i = 0; i < route.length; i++) {
                    var act = route[i];
                    var head = snake[0];
                    var dir = [head[0] - snake[1][0], head[1] - snake[1][1]];
                    var nHead;
                    if (act == 'F') {
                        nHead = [head[0] + dir[0], head[1] + dir[1]];
                    }
                    else if (act == 'L') {
                        nHead = [head[0] - dir[1], head[1] + dir[0]];
                    }
                    else if (act == 'R') {
                        nHead = [head[0] + dir[1], head[1] - dir[0]];
                    }
                    var nSnake = [];
                    for (var j = 0; j < snake.length - 1; j++) {
                        nSnake.push(snake[j]);
                    }
                    var nSnakeShortPath = (snakePath(nSnake));
                    nSnake.unshift(nHead);
                    if (nHead[0] >=0 && nHead[1] < cellN &&
                            nHead[1] >=0 && nHead[1] < cellN &&
                            gMap[nHead[0]][nHead[1]] === "C"){
                        nSnake.push(snake[j]);
                    }
                    var nSnakePath = (snakePath(nSnake));
                    setTimeout(function(){
                        var tempHead = nHead.slice(0, nHead.length);
                        var spath = nSnakePath;
                        var sShortPath = nSnakeShortPath;
                        return function() {
                            canvasSnake.animate({"path": sShortPath},
                                delay/2,
                                function() {
                                    canvasSnake.animate({"path": spath},
                                        delay/3)
                                }
                            );
                            if (gMap[tempHead[0]][tempHead[1]] === "C") {
                                var ch = cellSet[tempHead[0] * cellN + tempHead[1]];
                                ch.animate({"r": 0}, delay, callback=function() {
                                    ch.remove();
                                });
                            }
                            if (gMap[tempHead[0]][tempHead[1]] === "T") {
                                var t = cellSet[tempHead[0] * cellN + tempHead[1]];
                                t.toFront();
                                t.animate({"fill": colorOrange}, delay);
                            }
                        }
                    }(), stepDelay * i + delay);
                    snake = nSnake;
                }
            };
        }


    }
);
