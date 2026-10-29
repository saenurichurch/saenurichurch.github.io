class RSSImageSlideShow {
  constructor(containerId, rss, numRssItems, timePerImage) {
    this.containerId = containerId;
    this.rss = rss;
    this.numRssItems = numRssItems;                                                            
    this.timePerImage = timePerImage;                                                          
    this.slideIndex = 0;                                                                       
                                                                                               
    this.pictures = [];                                                                        
                                                                                               
    this.slideShowId = null;
    this.updateImageList();                                                                    

    // Check every hour.
    var refreshScheduler = later.parse.recur().on(0).minute();
    var responseFunc = this.updateImageList.bind(this);
    later.setInterval(responseFunc, refreshScheduler);
  }                                                                                            
                                                                                               
  updateImageList() {                                                                          
    var responseFunc = this.extractPictures.bind(this);                                        
                                                                                               
    console.log(this.rss);
    fetch(this.rss)                                                                            
        .then(response => {                                                                    
          return response.text();                                                              
        })                                                                                     
    .then(responseFunc)                                                                        
        .catch(err =>  {                                                                       
          console.log(err);                                                                    
        });                                                                                    
  }                                                                                            
                                                                                               
  extractPictures(str) {                                                                       
    var pictures = [];                                                                             
    if (this.numRssItems > 0) {
      var itemCount = 0;
      var lastItemIndex = 0;
      while (itemCount <= this.numRssItems) {
        lastItemIndex = str.indexOf('<item>', lastItemIndex);
        if (lastItemIndex == -1) {
          break;
        }
        ++itemCount;
        lastItemIndex += 6;  // Exclude the current <item>.
      }
      if (itemCount == 0) {
        return;
      }
      if (lastItemIndex != -1) {
        str = str.substring(0, lastItemIndex);
      }
    }
                                                                                               
    var rex =  /<img[^>]+src="?([^"\s]+)"?\s*/gi;                                              

    var m = '';
    while (m = rex.exec(str)) {
      pictures.push(m[1]);
    }

    if (pictures.length != this.pictures.length) {
      this.addImages(pictures);
    } else {
      for (var i = 0; i < pictures.length; ++i) {
        if (pictures[i] != this.pictures[i]) {
          this.addImages(pictures);
          return;
        }
      }
      console.log('Image not changed');
    }
  }

  addImages(pictures) {
    if (this.slideShowId != null) {
      clearTimeout(this.slideShowId);
    }
    this.pictures = pictures;

    var slideContainer = document.getElementById(this.containerId);
    var imageContent = '';
    for (var i = 0; i < this.pictures.length; ++i) {
      var str = '<img id="' + this.getSlideImageId(i) +
        '" class="slide" src="' + this.pictures[i] + '" style="width:100%">\n';
      imageContent += str;
    }
    slideContainer.innerHTML = imageContent;

    this.slideIndex = this.pictures.length - 1;

    // Wait until every image has downloaded so no slide shows up blank.
    // Start anyway after 2 minutes in case an image never finishes.
    var self = this;
    var started = false;
    var start = function() {
      if (!started && self.pictures === pictures) {
        started = true;
        self.startSlideShow();
      }
    };
    var images = slideContainer.getElementsByTagName('img');
    var remaining = images.length;
    var onDone = function() {
      if (--remaining <= 0) start();
    };
    if (remaining == 0) start();
    for (var i = 0; i < images.length; ++i) {
      if (images[i].complete) {
        onDone();
      } else {
        images[i].onload = onDone;
        images[i].onerror = onDone;
      }
    }
    setTimeout(start, 120000);
  }

  addClass(elem, name) {
    var c = elem.className;
    if (c) c += " ";  // if not blank, add a space separator
    c += name;
    elem.className = c;
  }

  removeClass(elem, name) {
    var c = elem.className;
    // remove name and extra blanks
    elem.className = c.replace(name, "").replace(/   /g, " ").replace(/^ | $/g, "");
  }

  getSlideImageId(id) {
    return this.containerId + '-slide-image-' + id;
  }

  startSlideShow() {
    if (this.pictures.length <= 0) {
      console.log('No images to slide show');
      return;
    }

    if (this.pictures.length == 1) {
      var newSlide = document.getElementById(this.getSlideImageId(0));
      this.addClass(newSlide, "showMe");

      return;
    }

    var currentSlide = document.getElementById(this.getSlideImageId(this.slideIndex));
    this.removeClass(currentSlide, "showMe");
    this.slideIndex++;
    if (this.slideIndex >= this.pictures.length) {this.slideIndex = 0}
    var newSlide = document.getElementById(this.getSlideImageId(this.slideIndex));
    this.addClass(newSlide, "showMe");

    var showTimeoutFunc = this.startSlideShow.bind(this); 
    this.slideShowId = setTimeout(showTimeoutFunc, this.timePerImage);
  }
}

var slides = {};
function createSlideShow(containerId, rss, numRssItems, secondsPerImage) {
  if (slides.hasOwnProperty(containerId)) {
    return false;
  }
  slides[containerId] = new RSSImageSlideShow(containerId, rss, numRssItems, secondsPerImage);
}
