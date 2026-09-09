window.InitUserScripts = function()
{
var player = GetPlayer();
var object = player.object;
var once = player.once;
var addToTimeline = player.addToTimeline;
var setVar = player.SetVar;
var getVar = player.GetVar;
var update = player.update;
var pointerX = player.pointerX;
var pointerY = player.pointerY;
var showPointer = player.showPointer;
var hidePointer = player.hidePointer;
var slideWidth = player.slideWidth;
var slideHeight = player.slideHeight;
window.Script1 = function()
{
  const player = GetPlayer();
// Function to disable autocomplete on all inputs
function disableAutocomplete() {
    var els = document.getElementsByTagName('input');
    for (var i = 0; i < els.length; i++) {
        els[i].setAttribute("autocomplete", "off");
    }
    //console.log("Disabled autocomplete for " + els.length + " inputs");
}

// Run immediately for existing inputs
disableAutocomplete();

// Observe DOM changes for new inputs (e.g., when layers load)
var observer = new MutationObserver(function(mutations) {
    disableAutocomplete();
});

// Observe changes to the DOM (childList and subtree cover layer additions)
observer.observe(document.body, { childList: true, subtree: true });

//function to calculate frame numbers
function calculateUnitProgress() {
    const player = GetPlayer();
    let currentSlideTitle = player.GetVar("slideTitle") ;
   
    try {
        currentSlideTitle = currentSlideTitle.trim();
        
        // Parse the slide title: e.g., "3.6.2.2.1"
        let parts = currentSlideTitle.split('.');
        
      	let theme, topic, learningOutcome, unit, slideNumber;
        
        if (parts.length === 5) {
            // Standard format: "3.6.2.2.1"
            theme = parts[0];           // 3
            topic = parts[1];           // 6  
            learningOutcome = parts[2]; // 2
            unit = parts[3];            // 2
            slideNumber = parseInt(parts[4]); // 1
            
        } else if (parts.length === 4) {
            // Single slide format: "3.6.2.2 Activity 2"
            theme = parts[0];           // 3
            topic = parts[1];           // 6  
            learningOutcome = parts[2]; // 2
            
            // Extract unit from the 4th part (might have text after it)
            var unitPart = parts[3].trim(); // "2 Activity 2"
            var unitMatch = unitPart.match(/^(\d+)/); // Extract first number
            
            if (unitMatch) {
                unit = unitMatch[1];    // 2
                slideNumber = 1;        // Default to 1 for single slide units
            } else {
                player.SetVar("Progress", "");
                return;
            }
            
        } else {
            // Invalid format
            player.SetVar("Progress", "");
            return;
        }
        
        // Validate that slideNumber is a valid number
        if (isNaN(slideNumber) || slideNumber < 1) {
            player.SetVar("Progress", "");
            return;
        }
        
        // Build unit identifier (Learning Outcome.Unit)
        var unitId = learningOutcome + "." + unit; // e.g., "2.2"
        
        // Get the unit registry
        var unitRegistry = player.GetVar("UnitRegistry") || "";
        
        if (!unitRegistry) {
            player.SetVar("Progress", "");
            return;
        }
        
        // Parse the registry: "2.1:4,2.2:5,2.3:3"
        var totalSlides = 1; // Default fallback
        var registryEntries = unitRegistry.split(',');
        
        for (var i = 0; i < registryEntries.length; i++) {
            var entry = registryEntries[i].trim();
            var entryParts = entry.split(':');
            
            if (entryParts.length === 2) {
                var registryUnitId = entryParts[0].trim();
                var registryCount = parseInt(entryParts[1].trim());
                
                if (registryUnitId === unitId && !isNaN(registryCount)) {
                    totalSlides = registryCount;
                    break;
                }
            }
        }
        
        // Create progress text
        var progressText = slideNumber + " of " + totalSlides;
        
        // Set the Progress variable
        player.SetVar("Progress", progressText);
        
    } catch (error) {
        // Fallback in case of any errors
        player.SetVar("Progress", "");
        console.log("Progress calculation error: " + error);
    }
}

// Function to minimize menu when entering full screen mode
(function () {
  if (window._slSidebarCtl && window._slSidebarCtl._initialized) return;

  function getBtn() {
    return document.querySelector('button#hamburger[aria-controls="sidebar"]');
  }
  function isExpanded() {
    var b = getBtn(); if (!b) return null;
    return b.getAttribute('aria-expanded') === 'true'; // true => panel visible
  }
  function clickToCollapse() { var b = getBtn(); if (b && isExpanded() === true) b.click(); }
  function clickToExpand()   { var b = getBtn(); if (b && isExpanded() === false) b.click(); }

  function waitForBtn(cb, maxMs) {
    var waited = 0, step = 50, max = maxMs || 8000;
    var t = setInterval(function(){
      if (getBtn()) { clearInterval(t); cb(); }
      else if ((waited += step) >= max) { clearInterval(t); }
    }, step);
  }

  function readFullScreen() {
    try {
      var v = GetPlayer().GetVar('FS');
      // Normalize possible representations to boolean
      return (v === true || v === 1 || v === 'true' || v === 'True');
    } catch(e){ return false; }
  }

  var ctl = window._slSidebarCtl || {};
  ctl._initialized = true;

  // State bookkeeping
  ctl.preFS = null;          // sidebar state before entering FS
  ctl.changedInFS = false;   // did user change sidebar while in FS?
  ctl.lastKnown = null;      // last known sidebar state during FS
  ctl.inFS = false;

  // Observe aria-expanded while in FS so we detect user changes
  ctl._obs = null;
  function attachObserver() {
    detachObserver();
    var b = getBtn(); if (!b) return;
    ctl._obs = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.attributeName === 'aria-expanded' && ctl.inFS) {
          ctl.changedInFS = true;
          ctl.lastKnown = (b.getAttribute('aria-expanded') === 'true');
        }
      });
    });
    ctl._obs.observe(b, { attributes: true, attributeFilter: ['aria-expanded'] });
    b.addEventListener('click', function(){
      if (ctl.inFS) {
        ctl.changedInFS = true;
        ctl.lastKnown = (b.getAttribute('aria-expanded') === 'true');
      }
    }, { passive:true });
  }
  function detachObserver() { if (ctl._obs) { ctl._obs.disconnect(); ctl._obs = null; } }

  function enterFS() {
    ctl.inFS = true;
    waitForBtn(function () {
      ctl.preFS = isExpanded();
      ctl.lastKnown = ctl.preFS;
      ctl.changedInFS = false;
      clickToCollapse();     // provide a clean fullscreen
      attachObserver();      // track user changes during FS
    });
  }
  function exitFS() {
    ctl.inFS = false;
    detachObserver();
    waitForBtn(function () {
      if (ctl.changedInFS) {
        // Respect how they left it in FS
        if (ctl.lastKnown === true) clickToExpand(); else clickToCollapse();
      } else {
        // Restore pre-FS state
        if (ctl.preFS === true) clickToExpand(); else clickToCollapse();
      }
    });
  }

  ctl.onFSChange = function(isFS) { isFS ? enterFS() : exitFS(); };

  // If slide starts already in fullscreen, apply immediately
  try { if (readFullScreen()) ctl.onFSChange(true); } catch(e){}

  window._slSidebarCtl = ctl;
})();

// Execute the function
calculateUnitProgress();
}

window.Script2 = function()
{
  const frame = document.querySelector('iframe[src*="WebObjects"]');
frame.contentWindow.pauseAnimation();
}

window.Script3 = function()
{
  const frame = document.querySelector('iframe[src*="WebObjects"]');
frame.contentWindow.playAnimation();
}

};
