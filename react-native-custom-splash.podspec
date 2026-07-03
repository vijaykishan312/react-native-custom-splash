require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-custom-splash"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["repository"]["url"]
  s.license      = package["license"]
  s.authors      = { package["author"] => "" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files = "ios/*.{h,m,mm,swift}"
  
  s.dependency "React-Core"
  
  # Built-in frameworks for video splash support
  s.frameworks = "AVFoundation", "AVKit"
  
  # Optional: Lottie animation support
  # Users who want Lottie animations must add to their Podfile:
  #   pod 'lottie-ios', '~> 4.4'
  # The module uses #if canImport(Lottie) to gracefully handle absence
end
