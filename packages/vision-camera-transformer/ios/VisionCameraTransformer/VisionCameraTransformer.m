#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

#if __has_include("VisionCameraTransformer/VisionCameraTransformer-Swift.h")
#import "VisionCameraTransformer/VisionCameraTransformer-Swift.h"
#else
#import "VisionCameraTransformer-Swift.h"
#endif

VISION_EXPORT_SWIFT_FRAME_PROCESSOR(TransformerFrameProcessorPluginPlugin, pipe)