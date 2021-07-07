// These are variables for YT elements related to chat.
// We expose them here so changes can be easily made if YT changes them.
ytChatUlClass = "#items";
ytChatIdentifier = "#items.yt-live-chat-item-list-renderer";
ytItemList = '#item-list.yt-live-chat-renderer';


ytChatMessageClass1 = ".yt-live-chat-item-list-renderer";
ytChatMessageClass2 = ".style-scope";
ytChatMessageContent = ".message";



// Bard Search
function BardSearcher() {
    // Attach listener that acts when a new chat message appears.
    return new MutationObserver(function (mutations) {
        // For each mutation object, we look for the addedNode object
        console.log("chat mutations..");
        console.log(mutations);
        mutations.forEach(function (mutation) {
            // A chat message would be an added node
            mutation.addedNodes.forEach(function (addedNode) {
                // At this point it's potentially a chatMessage object.
                var chatMessage = $(addedNode);
                console.log("chatMessage..");
                console.log(chatMessage);
                if (!chatMessage.is(ytChatMessageClass1, ytChatMessageClass2)) {
                    // this isn't a chat message, skip processing.
                    return;
                }
                return;
                // Grab the actual span element with the message content
                var messageElement = chatMessage.find(ytChatMessageContent);
                console.log(messageElement);
            });
        });
    });
}

// configuration of the observer:
var config = {attributes: false, childList: true, subtree: true, characterData: false};

var bardFinder = BardSearcher();

// The chat, particularly the element ".chat-lines", is dynamically loaded.
// We need to wait until the page is done loading everything in order to be
// able to grab it.
// We hijack MutationObserver as a way to check if an added, the chat.
var chatLoadedObserver = new MutationObserver(function (mutations, observer) {
    count =0;
    mutations.forEach(function (mutation) {
        count++;
        if(count > 100){
          console.log('disconnecting after 100 tries');
          observer.disconnect;
          return;
        };
        //var chatSelector = $(ytChatIdentifier);
        //var chatSelector = $(ytChatUlClass);
        var chatSelector = $(ytItemList);
        console.log(count, "for each mutation..");
        console.log("chatSelector:", chatSelector);
        //console.log("chatselector[0]");
        //console.log(chatSelector[0]);
        console.log("mutation", mutation);
        if (chatSelector.length > 0) {
            // Select the node element.
            var target = chatSelector[0];
            console.log("FOUND ELEMENT", target);

            // Pass in the target node, as well as the observer options
            // do something
            // add second MutationObserver
            bardFinder.observe(target, config);

            //Unregister chatLoadedObserver. We don't need to check for the chat element anymore
            observer.disconnect();
            console.log('disconnected');
        }
    })
});

//var htmlBody = $("body")[0];
chatLoadedObserver.observe(document.body, config);
