package Not_Found.service;

import org.springframework.stereotype.Service;

@Service
public class DeviceStateService {
    private boolean powerOn = false;
    private String mode = "AUTO";
    private int level = 1;

    public synchronized void updatePower(boolean on) { this.powerOn = on; }
    public synchronized void updateMode(String m) { this.mode = m; }
    public synchronized void updateLevel(int l) { this.level = l; }

    public synchronized boolean isPowerOn() { return powerOn; }
    public synchronized String getMode() { return mode; }
    public synchronized int getLevel() { return level; }
}