var createSongRow = function(songNumber, songName, songLength) {
    var template = 
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
      ;
    
    var $row = $(template);
    
    var clickHandler = function() {
        
        var songNumber = parseInt($(this).attr('data-song-number'));
       
        if (currentlyPlayingSongNumber !== null) {
             // Revert to song number for currently playing song because user started playing new song.
            var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingCell.html(currentlyPlayingSongNumber);
        }
        if (currentlyPlayingSongNumber !== songNumber) {
            // Switch from Play -> Pause button to indicate new song is playing.
            
            $(this).html(pauseButtonTemplate);
            setSong(songNumber);
            currentSoundFile.play();
            updateSeekBarWhileSongPlays();
            updatePlayerBarSong();

            setVolume(currentVolume);
            
        } else if (currentlyPlayingSongNumber === songNumber) {
            if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(PlayerBarPauseButton);
                currentSoundFile.play();
                updateSeekBarWhileSongPlays();
            } else {
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(PlayerBarPlayButton);
                currentSoundFile.pause();
            }
        }
    };
    
    var onHover = function(event) { 
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));
        
        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(playButtonTemplate);
        }
    };
    
    var offHover = function(event) {
        var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));
        
        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(songNumber);
        }
    };
    
    $row.find('.song-item-number').click(clickHandler);
    
    $row.hover(onHover, offHover);
    
    return $row;
};

var $albumTitle = $('.album-view-title');
var $albumArtist = $('.album-view-artist');
var $albumReleaseInfo = $('.album-view-release-info');
var $albumImage = $('.album-cover-art');
var $albumSongList = $('.album-view-song-list');

var setCurrentAlbum = function(album) {
    currentAlbum = album;
    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);
    
    $albumSongList.empty();
    
    for (var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration);
        $albumSongList.append($newRow);
    }
};

var updateSeekBarWhileSongPlays = function() {
    if (currentSoundFile) {
        currentSoundFile.bind('timeupdate', function(event) {
            var seekBarFillRatio = this.getTime() / this.getDuration();
            var $seekBar = $('.seek-control .seek-bar');
            var filteredTime = filterTimeCode(this.getTime());
            var filteredDuration = filterTimeCode(this.getDuration());
            updateSeekPercentage($seekBar, seekBarFillRatio);
            setCurrentTimeInPlayer(filteredTime);
            setTotalTimeInPlayer(filteredDuration);
        });
    }
};

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
    
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});    
};

var setupSeekBars = function() {
    var $seekBars = $('.player-bar .seek-bar');
    
    $seekBars.click(function(event) {
        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        var seekBarFillRatio = offsetX / barWidth;
        
        if ($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }
        updateSeekPercentage($(this), seekBarFillRatio);

    });

    $seekBars.find('.thumb').mousedown(function(event) {
        
        var $seekBar = $(this).parent();
        
        $(document).bind('mousemove.thumb', function(event) {
            var offsetX = event.pageX - $seekBar.offset().left;
            var barWidth = $seekBar.width();
            var seekBarFillRatio = offsetX / barWidth;
            
            if ($(this).parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());
            } else if ($(this).parent().attr('class') == 'volume') {
                setVolume(seekBarFillRatio);
            }
            
            updateSeekPercentage($seekBar, seekBarFillRatio);
        });
        
        $(document).bind('mouseup.thumb', function() {
            $(document).unbind('mousemove.thumb');
            $(document).unbind('mouseup.thumb');
        });
    });
};

var setCurrentTimeInPlayer = function(currentTime) {
    $('.current-time').html(currentTime);
};

var setTotalTimeInPlayer = function(totalTime) {
    $('.total-time').html(totalTime);
};

var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

var filterTimeCode = function(timeInSeconds) {
    var timeInt = parseFloat(timeInSeconds);
    var timeFloor = Math.floor(timeInt);
    var time = Math.floor(timeFloor / 60) + ':' + (timeFloor % 60 < 10 ? '0' + timeFloor % 60 : timeFloor % 60);
    return time;
};

var nextSong = function() {
    var songIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    
    songIndex++;
   
    if (songIndex >= currentAlbum.songs.length) {
        songIndex = 0; 
    }
    
    var lastSongNumber = currentlyPlayingSongNumber;
        
    setSong(songIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    //update player bar to show new song 
    updatePlayerBarSong();
    
    //update html of previouse song item to song-item-number
    var $nextSongnumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $nextSongnumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
    var songIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    
    songIndex--;
    
    if (songIndex < 0) {
        songIndex = currentAlbum.songs.length - 1;
    }
    
    var lastSongNumber = currentlyPlayingSongNumber;
        
    setSong(songIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    //update player bar to show new song
    updatePlayerBarSong();
    
    //update html of next sonf item to song-item-number 
    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = $('.song-item-number[data-song-number="' + lastSongNumber + '"]');
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var setSong = function(songNumber) {
    if (currentSoundFile) {
        currentSoundFile.stop();
    }
    // set currentlyPlayingSongNumber 
    currentlyPlayingSongNumber = parseInt(songNumber);
    // set currentSongFromAlbume
    currentSongFromAlbum = currentAlbum.songs[songNumber -1];
    // select sound file 
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: ['mp3'], 
        preload: true
    });
    
    setVolume(currentVolume);
};

var seek = function(time) {
    if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
}

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
        var $volumeFill = $('.volume .fill');
        var $volumeThumb = $('.volume .thumb');
        $volumeFill.width(currentVolume + '%');
        $volumeThumb.css({left: currentVolume + '%'});
    }
    currentVolume = volume;
}

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var updatePlayerBarSong = function() {
    $('.main-controls .play-pause').html(PlayerBarPauseButton);
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
};

var togglePlayFromPlayerBar = function() {
    if (currentSoundFile.isPaused()) {
        getSongNumberCell(currentlyPlayingSongNumber).html(pauseButtonTemplate);
        $(this).html(PlayerBarPauseButton);
        currentSoundFile.play();
    } else if (currentSoundFile) {
        getSongNumberCell(currentlyPlayingSongNumber).html(playButtonTemplate);
        $(this).html(PlayerBarPlayButton);
        currentSoundFile.pause();
    }
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var PlayerBarPlayButton = '<span class="ion-play"></span>';
var PlayerBarPauseButton = '<span class="ion-pause"></span>';

var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playPauseButton = $('.main-controls .play-pause');

$(document).ready(function() {
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playPauseButton.click(togglePlayFromPlayerBar);
});
