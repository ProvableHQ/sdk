package com.provable.shield.sdk.mobile;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.uimanager.ViewManager;
import com.margelo.nitro.shield.ShieldMobileSdkOnLoad;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class ShieldMobileSdkPackage extends TurboReactPackage {
  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
        return new HashMap<>();
    };
  }

  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return new ArrayList<>();
  }

  static {
    ShieldMobileSdkOnLoad.initializeNative();
  }

  public static void initialize() {
    ShieldMobileSdkOnLoad.initializeNative();
  }
}
