//
//  SplashScreenModule.m
//  RNCustomSplash
//
//  Bridge for SplashScreenModule
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SplashScreen, NSObject)

RCT_EXTERN_METHOD(show)

RCT_EXTERN_METHOD(hide:(BOOL)animated
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
