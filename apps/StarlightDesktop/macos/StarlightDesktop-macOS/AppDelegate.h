#import <Cocoa/Cocoa.h>
#import <React/RCTBridgeDelegate.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, RCTBridgeDelegate>

@property (nonatomic, strong) NSWindow *window;
@property (nonatomic, readonly) NSString *moduleName;
@property (nonatomic, readonly) NSDictionary *initialProps;
@property (nonatomic, strong) NSViewController *rootViewController;

@end
