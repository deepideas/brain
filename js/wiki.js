
var wiki = (function() {

    /**
     * Fix Wikipedia links
     */
    function fix_wikipedia_links(links) {
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var link_wiki = link.href.split("/").slice(-1)[0];
            if (link_wiki in tree.tree_index_by_wiki) {
                var node = tree.tree_index_by_wiki[link_wiki];
                link.href = "javascript:tree.select_node('" + node.id + "')";
            } else {
                link.href = "https://en.wikipedia.org/wiki/" + link_wiki;
                link.target = "_blank";
            }
        }
    }


    /**
     * Loads a node into the active view
     */
    function load_wiki(node) {
        // Set title
        //$("#title").html(node.text);

        // Load wiki article
        //$("#wikipedia-text").html("");
        //$("#wikipedia-images").html("");
        if (typeof(node.original.wiki) != "undefined") {

            $("#panel-wikipedia").LoadingOverlay("show", {
                "imageColor": "#747474"
            });
            var wiki;
            if (typeof(node.original.wiki) == "string") {
                wiki = node.original.wiki;
            } else {
                wiki = node.original.wiki[0];
            }
            wiki = wiki.split("#")[0];
            $.ajax({
                type: "GET",
                url: "http://en.wikipedia.org/w/api.php?action=parse&format=json&prop=text&section=0&page=" + wiki + "&callback=?",
                contentType: "application/json; charset=utf-8",
                async: false,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var markup = data.parse.text["*"];
                    var blurb = $('<div></div>').html(markup);

                    fix_wikipedia_links($(blurb).find('a'));

                    var text = $(blurb).find('p');
                    var images = $(blurb).find('.infobox img');

                    $('#wikipedia-images').html("");
                    images.each(function(i, image) {
                        var card = document.createElement("div");
                        $(card).css("text-align", "center");

                        //$(image).addClass("img-thumbnail");
                        $(image).addClass("mx-auto");

                        var card_body = document.createElement("div");
                        $(card_body).addClass("card-body");

                        var figcaption_text = $(image).parent().parent().find('div').html();
                        var figcaption = document.createElement("figcaption");
                        $(figcaption).addClass("figure-caption text-center");
                        $(figcaption).html(figcaption_text);
                        $(card_body).append(figcaption);

                        $(card).append(image);
                        $(card).append(card_body);
                        $('#wikipedia-images').append(card);
                    })

                    if (images.length > 0) {
                        $('#wikipedia-images_card').show();
                    } else {
                        $('#wikipedia-images_card').hide();
                    }

                    $('#wikipedia-text').html("<span style='font-size: 12px; font-style: italic; color: #666666;'>Source: en.wikipedia.org | <a href='http://en.wikipedia.org/wiki/" + wiki + "' target='_blank'>Read the whole article</a></span>");

                    $('#wikipedia-text').append(text);
                    $("#panel-wikipedia").LoadingOverlay("hide");

                },
                error: function (errorMessage) {
                    $("#wikipedia-text").html("");
                    $("#panel-wikipedia").LoadingOverlay("hide");
                }
            });
        }
    }

    return {
        load_wiki: load_wiki
    };

})();
