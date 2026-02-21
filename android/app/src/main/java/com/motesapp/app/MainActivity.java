package com.motesapp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
// Lägg till importen för pluginen
import app.capgo.audiorecorder.CapacitorAudioRecorderPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registrera pluginen manuellt innan du anropar super.onCreate()
        registerPlugin(CapacitorAudioRecorderPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
