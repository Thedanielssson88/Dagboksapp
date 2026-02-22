package com.motesapp.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GeminiNano")
public class GeminiNanoPlugin extends Plugin {

    @PluginMethod
    public void generateText(PluginCall call) {
        String systemPrompt = call.getString("systemPrompt", "");
        String prompt = call.getString("prompt", "");

        try {
            JSObject ret = new JSObject();
            // Mock-svar för att testa bryggan
            String mockJson = "{ \"summary\": \"Nano-bron fungerar!\", \"mood\": \"🚀\", \"learnings\": [\"Native anrop fungerar\"] }";
            ret.put("text", mockJson);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Kunde inte nå AICore: " + e.getMessage());
        }
    }
}
