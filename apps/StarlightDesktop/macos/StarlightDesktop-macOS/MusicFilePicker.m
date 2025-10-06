#import "MusicFilePicker.h"
#import <React/RCTLog.h>
#import <Cocoa/Cocoa.h>
#import <AVFoundation/AVFoundation.h>

@implementation MusicFilePicker

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(pickMusicFiles:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];

    // Configure the panel
    [panel setCanChooseFiles:YES];
    [panel setCanChooseDirectories:YES];
    [panel setAllowsMultipleSelection:YES];
    [panel setAllowedFileTypes:@[@"mp3", @"m4a", @"wav", @"aac", @"flac", @"aiff"]];
    [panel setMessage:@"Select music files or folders"];
    [panel setPrompt:@"Import"];

    // Show the panel
    [panel beginWithCompletionHandler:^(NSInteger result) {
      if (result == NSModalResponseOK) {
        NSMutableArray *files = [NSMutableArray array];

        for (NSURL *url in panel.URLs) {
          BOOL isDirectory;
          [[NSFileManager defaultManager] fileExistsAtPath:url.path isDirectory:&isDirectory];

          if (isDirectory) {
            // If it's a directory, scan for music files
            NSArray *musicFiles = [self scanDirectoryForMusic:url];
            [files addObjectsFromArray:musicFiles];
          } else {
            // Single file
            NSDictionary *fileInfo = [self getFileInfo:url];
            if (fileInfo) {
              [files addObject:fileInfo];
            }
          }
        }

        resolve(files);
      } else {
        resolve(@[]);
      }
    }];
  });
}

- (NSArray *)scanDirectoryForMusic:(NSURL *)directoryURL {
  NSMutableArray *musicFiles = [NSMutableArray array];
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSArray *allowedExtensions = @[@"mp3", @"m4a", @"wav", @"aac", @"flac", @"aiff"];

  NSDirectoryEnumerator *enumerator = [fileManager enumeratorAtURL:directoryURL
                                         includingPropertiesForKeys:@[NSURLNameKey, NSURLIsDirectoryKey]
                                                            options:NSDirectoryEnumerationSkipsHiddenFiles
                                                       errorHandler:nil];

  for (NSURL *fileURL in enumerator) {
    NSString *filename;
    [fileURL getResourceValue:&filename forKey:NSURLNameKey error:nil];

    NSNumber *isDirectory;
    [fileURL getResourceValue:&isDirectory forKey:NSURLIsDirectoryKey error:nil];

    if (![isDirectory boolValue]) {
      NSString *extension = [[fileURL pathExtension] lowercaseString];
      if ([allowedExtensions containsObject:extension]) {
        NSDictionary *fileInfo = [self getFileInfo:fileURL];
        if (fileInfo) {
          [musicFiles addObject:fileInfo];
        }
      }
    }
  }

  return musicFiles;
}

- (NSDictionary *)getFileInfo:(NSURL *)fileURL {
  AVAsset *asset = [AVAsset assetWithURL:fileURL];

  NSString *title = @"Unknown";
  NSString *artist = @"Unknown Artist";
  NSString *album = @"Unknown Album";
  NSNumber *duration = @0;

  // Get metadata
  NSArray *metadata = [asset commonMetadata];
  for (AVMetadataItem *item in metadata) {
    if ([item.commonKey isEqualToString:AVMetadataCommonKeyTitle]) {
      title = (NSString *)item.value ?: title;
    } else if ([item.commonKey isEqualToString:AVMetadataCommonKeyArtist]) {
      artist = (NSString *)item.value ?: artist;
    } else if ([item.commonKey isEqualToString:AVMetadataCommonKeyAlbumName]) {
      album = (NSString *)item.value ?: album;
    }
  }

  // If no title in metadata, use filename
  if ([title isEqualToString:@"Unknown"]) {
    title = [[fileURL lastPathComponent] stringByDeletingPathExtension];
  }

  // Get duration
  CMTime time = asset.duration;
  if (CMTIME_IS_VALID(time)) {
    duration = @(CMTimeGetSeconds(time));
  }

  // Format duration as string
  int totalSeconds = [duration intValue];
  int minutes = totalSeconds / 60;
  int seconds = totalSeconds % 60;
  NSString *durationString = [NSString stringWithFormat:@"%d:%02d", minutes, seconds];

  return @{
    @"id": [[NSUUID UUID] UUIDString],
    @"title": title,
    @"artist": artist,
    @"album": album,
    @"duration": durationString,
    @"durationSeconds": duration,
    @"filePath": fileURL.path
  };
}

@end