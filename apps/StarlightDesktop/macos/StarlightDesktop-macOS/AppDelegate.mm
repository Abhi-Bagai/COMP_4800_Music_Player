#import "AppDelegate.h"
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@interface AppDelegate ()
@property (nonatomic, strong) RCTBridge *bridge;
@end

@implementation AppDelegate

@synthesize window = _window;
@synthesize moduleName = _moduleName;
@synthesize initialProps = _initialProps;
@synthesize rootViewController = _rootViewController;

- (void)sl_logWindowState:(NSString *)label
{
  NSWindow *w = self.window;
  NSMutableArray<NSString *> *ordered = [NSMutableArray array];
  for (NSWindow *ow in [NSApp orderedWindows]) {
    [ordered addObject:[NSString stringWithFormat:@"<%p title='%@' visible=%d key=%d frame=%@>",
                        ow, ow.title, ow.isVisible, ow.isKeyWindow, NSStringFromRect(ow.frame)]];
  }
  NSLog(@"[Starlight] %@ | window=%p title='%@' visible=%d key=%d frame=%@ contentVC=%@ | ordered=%@",
        label,
        w,
        w ? w.title : @"(nil)",
        w ? w.isVisible : NO,
        w ? w.isKeyWindow : NO,
        w ? NSStringFromRect(w.frame) : @"(nil)",
        w.contentViewController,
        ordered);
}

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  NSLog(@"[Starlight] App did finish launching!");

  _moduleName = @"StarlightDesktop";
  _initialProps = @{};

  // Create the window first
  NSRect frame = NSMakeRect(100, 100, 800, 600);
  self.window = [[NSWindow alloc] initWithContentRect:frame
                                             styleMask:(NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskResizable)
                                               backing:NSBackingStoreBuffered
                                                 defer:NO];

  self.window.title = @"Starlight Desktop";

  // Show the window immediately with a loading message
  NSView *loadingView = [[NSView alloc] initWithFrame:frame];
  loadingView.wantsLayer = YES;
  loadingView.layer.backgroundColor = [[NSColor whiteColor] CGColor];

  NSTextField *label = [NSTextField labelWithString:@"Loading React Native..."];
  label.textColor = [NSColor blackColor];
  label.font = [NSFont systemFontOfSize:18];
  [label sizeToFit];
  label.frame = NSMakeRect(50, frame.size.height/2, label.frame.size.width, label.frame.size.height);
  [loadingView addSubview:label];

  self.window.contentView = loadingView;
  [self.window makeKeyAndOrderFront:nil];
  [self.window center];

  NSLog(@"[Starlight] Window visible, now loading React Native...");

  // Initialize React Native bridge
  self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:nil];

  // Wait a moment then load React Native content
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    // Create React Native root view
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                       moduleName:self.moduleName
                                                initialProperties:self.initialProps];
    rootView.backgroundColor = [NSColor whiteColor];

    // Replace the loading view with React Native content
    self.window.contentView = rootView;

    // Ensure the window and content are interactive
    [self.window makeFirstResponder:rootView];
    [self.window makeKeyAndOrderFront:nil];
    [[NSApplication sharedApplication] activateIgnoringOtherApps:YES];

    NSLog(@"[Starlight] React Native content loaded and interactive!");
  });
}

- (void)applicationDidBecomeActive:(NSNotification *)notification
{
  if (self.window != nil) {
    [self.window makeKeyAndOrderFront:self];
    [self sl_logWindowState:@"applicationDidBecomeActive"];  
  }
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)theApplication hasVisibleWindows:(BOOL)flag
{
  if (self.window != nil) {
    [self.window makeKeyAndOrderFront:self];
    [self sl_logWindowState:@"applicationShouldHandleReopen"];  
    return YES;
  }
  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}


@end
