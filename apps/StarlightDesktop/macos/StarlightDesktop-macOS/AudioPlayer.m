#import "AudioPlayer.h"
#import <React/RCTLog.h>

@implementation AudioPlayer

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[@"onPlaybackStateChanged", @"onProgress", @"onTrackFinished"];
}

RCT_EXPORT_METHOD(loadAndPlay:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSURL *fileURL = [NSURL fileURLWithPath:filePath];
    NSError *error;

    // Stop current player if exists
    if (self.player) {
      [self.player stop];
      [self.progressTimer invalidate];
      self.progressTimer = nil;
    }

    // Create new player
    self.player = [[AVAudioPlayer alloc] initWithContentsOfURL:fileURL error:&error];

    if (error) {
      reject(@"LOAD_ERROR", @"Failed to load audio file", error);
      return;
    }

    self.player.delegate = self;
    [self.player prepareToPlay];

    BOOL success = [self.player play];
    if (success) {
      [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @YES}];

      // Start progress timer
      self.progressTimer = [NSTimer scheduledTimerWithTimeInterval:0.5
                                                           target:self
                                                         selector:@selector(updateProgress)
                                                         userInfo:nil
                                                          repeats:YES];

      resolve(@{@"success": @YES});
    } else {
      reject(@"PLAY_ERROR", @"Failed to play audio", nil);
    }
  });
}

RCT_EXPORT_METHOD(pause)
{
  if (self.player && self.player.isPlaying) {
    [self.player pause];
    [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
  }
}

RCT_EXPORT_METHOD(resume)
{
  if (self.player && !self.player.isPlaying) {
    [self.player play];
    [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @YES}];
  }
}

RCT_EXPORT_METHOD(stop)
{
  if (self.player) {
    [self.player stop];
    [self.progressTimer invalidate];
    self.progressTimer = nil;
    [self sendEventWithName:@"onPlaybackStateChanged" body:@{@"isPlaying": @NO}];
  }
}

RCT_EXPORT_METHOD(seekTo:(double)seconds)
{
  if (self.player) {
    self.player.currentTime = seconds;
  }
}

RCT_EXPORT_METHOD(setVolume:(float)volume)
{
  if (self.player) {
    self.player.volume = volume;
  }
}

- (void)updateProgress {
  if (self.player && self.player.isPlaying) {
    [self sendEventWithName:@"onProgress" body:@{
      @"currentTime": @(self.player.currentTime),
      @"duration": @(self.player.duration)
    }];
  }
}

#pragma mark - AVAudioPlayerDelegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
  [self.progressTimer invalidate];
  self.progressTimer = nil;
  [self sendEventWithName:@"onTrackFinished" body:@{@"success": @(flag)}];
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error {
  RCTLogError(@"Audio decode error: %@", error.localizedDescription);
}

@end