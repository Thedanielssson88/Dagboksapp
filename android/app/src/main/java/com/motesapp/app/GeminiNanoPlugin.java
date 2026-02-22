package com.motesapp.app;

import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.provider.DocumentsContract;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// RÄTT IMPORTS FOR NATIVE PIXEL AICORE
import com.google.ai.edge.aicore.GenerativeModel;
import com.google.ai.edge.aicore.GenerationConfig;
import com.google.ai.edge.aicore.DownloadConfig;
import com.google.ai.edge.aicore.DownloadCallback;
import com.google.ai.edge.aicore.java.GenerativeModelFutures;
import com.google.ai.edge.aicore.Content;

import com.google.common.util.concurrent.FutureCallback;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

@CapacitorPlugin(name = "GeminiNano")
public class GeminiNanoPlugin extends Plugin {

    @PluginMethod
    public void generateText(PluginCall call) {
        String systemPrompt = call.getString("systemPrompt", "");
        String prompt = call.getString("prompt", "");

        try {
            // Skapa konfigurationen korrekt för Java
            GenerationConfig.Builder configBuilder = new GenerationConfig.Builder();
            configBuilder.setContext(getContext());
            GenerationConfig config = configBuilder.build();

            // Skapa modellen via AICore (Pixel Native)
            GenerativeModel gm = new GenerativeModel(config, new DownloadConfig(new DownloadCallback() {}));
            GenerativeModelFutures model = GenerativeModelFutures.from(gm);

            Content content = new Content.Builder()
                .addText(systemPrompt + "\n\n" + prompt)
                .build();

            ListenableFuture<com.google.ai.edge.aicore.GenerateContentResponse> responseFuture = model.generateContent(content);

            Futures.addCallback(responseFuture, new FutureCallback<com.google.ai.edge.aicore.GenerateContentResponse>() {
                @Override
                public void onSuccess(com.google.ai.edge.aicore.GenerateContentResponse result) {
                    JSObject ret = new JSObject();
                    ret.put("text", result.getText());
                    call.resolve(ret);
                }

                @Override
                public void onFailure(Throwable t) {
                    call.reject("AICore fel: " + t.getMessage());
                }
            }, getContext().getMainExecutor());

        } catch (Exception e) {
            call.reject("Kunde inte starta AICore: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getRealPath(PluginCall call) {
        String uriString = call.getString("uri");
        try {
            Uri uri = Uri.parse(uriString);
            String path = null;
            if (DocumentsContract.isDocumentUri(getContext(), uri)) {
                String docId = DocumentsContract.getDocumentId(uri);
                if (docId.startsWith("raw:")) {
                    path = docId.replaceFirst("raw:", "");
                } else {
                    String[] split = docId.split(":");
                    path = Environment.getExternalStorageDirectory() + "/" + split[1];
                }
            }
            JSObject ret = new JSObject();
            ret.put("path", path != null ? path : uriString);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
