# Launcher小窗口音量调整

由于dvb播放的音量控制在dvb_common中，但是新osd的launcher无法直接依赖dvb_common，因此只能通过广播的方式进行控制。

## 一、在dvb_common接收广播

```kotlin
package com.tosmart.dvb.common.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.dvb.dbase.DataBaseManager
import com.dvb.playchannel.ChannelPlayer
import com.tosmart.osd.utils.SPUtils
import com.util.Customize
import com.util.DVBConstants

class DvbVolumeControlReceiver : BroadcastReceiver() {
    companion object {
        private const val TAG = "VolumeControlReceiver"
    }

    private var mCurVolume = 0

    private var mIsMute = false


    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        mIsMute = DataBaseManager.getInstance(context).boxInfo.mute_state.toInt() == 1
        mCurVolume = ChannelPlayer.getInstance(context).currentVolume
        when (action) {
            DVBConstants.ACTION_VOLUME_UP -> {
                dealVolumeUp(context)
            }

            DVBConstants.ACTION_VOLUME_DOWN -> {
                dealVolumeDown(context)
            }

            DVBConstants.ACTION_VOLUME_MUTE -> {
                dealMute(context)
            }

            DVBConstants.ACTION_SET_VOLUME -> {
                val setVolume = intent.getIntExtra(DVBConstants.EXTRA_SET_VOLUME_LEVEL, 0)
                dealSetVolume(setVolume, context)
            }
        }
    }

    private fun dealSetVolume(volume: Int, context: Context) {
        if (mIsMute) {
            mIsMute = false
        }
        if (volume == 0) {
            mIsMute = true
        } else if (0 < volume && volume <= Customize.getInstance().maxVolumeValue) {
            mCurVolume = volume
        } else {
            return
        }
        setVolumeValue(volume, context)
    }

    private fun dealVolumeUp(context: Context) {
        if (mIsMute) {
            mIsMute = false
        }
        if (mCurVolume < Customize.getInstance().maxVolumeValue) {
            mCurVolume++
        } else {
            mCurVolume = Customize.getInstance().maxVolumeValue
        }
        setVolumeValue(mCurVolume, context)
    }

    private fun dealVolumeDown(context: Context) {
        if (mIsMute) {
            mIsMute = false
        }
        if (mCurVolume > 0) {
            mCurVolume--
        } else {
            mCurVolume = 0
        }

        if (mCurVolume == 0) {
            mIsMute = true
        }
        setVolumeValue(mCurVolume, context)
    }

    private fun dealMute(context: Context) {
        if (mIsMute) {
            mIsMute = false
            mCurVolume = SPUtils.getInstance().getInt(DVBConstants.MUTE_VOLUME_LEVEL, 0)
            if (mCurVolume == 0) {
                mCurVolume = Customize.getInstance().maxVolumeValue
            }
            setVolumeValue(mCurVolume, context)
            SPUtils.getInstance().remove(DVBConstants.MUTE_VOLUME_LEVEL)
        } else {
            mIsMute = true
            SPUtils.getInstance().put(DVBConstants.MUTE_VOLUME_LEVEL, mCurVolume)
            setVolumeValue(0, context)
        }
    }

    private fun setVolumeValue(volume: Int, context: Context) {
        val channelPlayer = ChannelPlayer.getInstance(context)
        channelPlayer.setAudioVolume(volume)
        DataBaseManager.getInstance(context).saveVolume(volume, mIsMute, channelPlayer.curPlayProgram)
        SPUtils.getInstance().put(DVBConstants.EXTRA_IS_MUTE, mIsMute)
        broadcastVolumeInfo(context, volume, mIsMute)
    }

    private fun broadcastVolumeInfo(context: Context, volume: Int, isMute: Boolean) {
        val intent = Intent(DVBConstants.ACTION_VOLUME_CHANGED)
        intent.putExtra(DVBConstants.EXTRA_GET_VOLUME_LEVEL, volume)
        intent.putExtra(DVBConstants.EXTRA_IS_MUTE, isMute)
        context.sendBroadcast(intent)
    }

}
```

```xml
<receiver
    android:name="com.tosmart.dvb.common.receiver.DvbVolumeControlReceiver"
    android:directBootAware="true"
    android:enabled="true"
    android:exported="true">
    <intent-filter android:priority="800">
        <action android:name="com.tosmart.action.VOLUME_UP" />
        <action android:name="com.tosmart.action.VOLUME_DOWN" />
        <action android:name="com.tosmart.action.VOLUME_MUTE" />
        <action android:name="com.tosmart.action.SET_VOLUME" />
    </intent-filter>
</receiver>
```

### 关键：

1. 通过SP缓存保存静音状态

2. 返回音量调整后的音量信息

   ```kotlin
   private fun broadcastVolumeInfo(context: Context, volume: Int, isMute: Boolean) {
           val intent = Intent(DVBConstants.ACTION_VOLUME_CHANGED)
           intent.putExtra(DVBConstants.EXTRA_GET_VOLUME_LEVEL, volume)
           intent.putExtra(DVBConstants.EXTRA_IS_MUTE, isMute)
           context.sendBroadcast(intent)
       }
   ```

## 二、OttLauncherCore工具类发送广播

```kotlin
package com.tosmart.ott.util

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter

/*
 * 用于 launcher小窗口的音量控制, activity destroy 时调用 unRegisterVolumeReceiver()
 * send broadcast to com.tosmart.dvb.common.receiver.DvbVolumeControlReceiver
 */

class DvbVolumeControlUtil(context: Context, volumeChangeListener: VolumeChangeListener) {
    companion object {
        const val ACTION_VOLUME_UP: String = "com.tosmart.action.VOLUME_UP"
        const val ACTION_VOLUME_DOWN: String = "com.tosmart.action.VOLUME_DOWN"
        const val ACTION_VOLUME_MUTE: String = "com.tosmart.action.VOLUME_MUTE"
        const val ACTION_VOLUME_CHANGED: String = "com.tosmart.action.VOLUME_CHANGED"
        const val EXTRA_GET_VOLUME_LEVEL: String = "get_volume_level"
        const val EXTRA_IS_MUTE: String = "is_mute"
        const val FIRST_VOLUME_LEVEL = -1
        const val SP_UTILS = "spUtils"
    }
    private val mContext: Context = context
    private val mVolumeControlReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                ACTION_VOLUME_CHANGED -> {
                    val isMute = intent.getBooleanExtra(EXTRA_IS_MUTE, false)
                    val volumeLevel = intent.getIntExtra(EXTRA_GET_VOLUME_LEVEL, 0)
                    mVolumeChangeListener.updateVolumeUI(volumeLevel, isMute)
                }
            }
        }
    }
    private val mVolumeChangeListener: VolumeChangeListener = volumeChangeListener

    init {
        val filter = IntentFilter().apply {
            addAction(ACTION_VOLUME_CHANGED)
        }
        mContext.registerReceiver(mVolumeControlReceiver, filter)
        val sp = mContext.getSharedPreferences(SP_UTILS, Context.MODE_PRIVATE)
        val isMute = sp.getBoolean(EXTRA_IS_MUTE, false)
        mVolumeChangeListener.updateVolumeUI(FIRST_VOLUME_LEVEL, isMute)
    }

    fun setVolumeUp() {
        val intent = Intent(ACTION_VOLUME_UP)
        intent.flags = Intent.FLAG_RECEIVER_FOREGROUND
        mContext.sendBroadcast(intent)
    }


    fun setVolumeDown() {
        val intent = Intent(ACTION_VOLUME_DOWN)
        intent.flags = Intent.FLAG_RECEIVER_FOREGROUND
        mContext.sendBroadcast(intent)
    }

    fun setVolumeMute() {
        val intent = Intent(ACTION_VOLUME_MUTE)
        intent.flags = Intent.FLAG_RECEIVER_FOREGROUND
        mContext.sendBroadcast(intent)
    }


    fun unRegisterVolumeReceiver() {
        mContext.unregisterReceiver(mVolumeControlReceiver)
    }

    interface VolumeChangeListener {
        /**
         * 音量变化回调,更新音量相关UI
         */
        fun updateVolumeUI(volumeLevel: Int, isMute: Boolean)
    }

}
```

### 关键：

1. 快速接收广播，使用` Intent.FLAG_RECEIVER_FOREGROUND`使广播的优先级排在最前
2. 初始化的时候会去获取静音状态，更新UI，进入小窗口播放的时候如果是静音的就显示静音图标，由于刚进入launcher的时候不需要音量显示，所以传的音量是-1。如果后续小窗口要添加音量条，只需要排除音量是-1的情况。

## 三、Launcher调用该方法

在带有小弹窗的activity中，重写key事件，并实现ott的工具类

```kotlin
private lateinit var mDvbVolumeControlUtil: DvbVolumeControlUtil

mDvbVolumeControlUtil = DvbVolumeControlUtil(this, object : DvbVolumeControlUtil.VolumeChangeListener {
            override fun updateVolumeUI(volumeLevel: Int, isMute: Boolean) {
                if(volumeLevel != DvbVolumeControlUtil.FIRST_VOLUME_LEVEL){
                    //更新音量条
                }
                //更新静音图标
            }
        })

 override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN){
            when (keyCode){
                KeyEvent.KEYCODE_VOLUME_UP -> {
                    mDvbVolumeControlUtil.setVolumeUp()
                    return true
                }
                KeyEvent.KEYCODE_VOLUME_DOWN -> {
                    mDvbVolumeControlUtil.setVolumeDown()
                    return true
                }
                KeyEvent.KEYCODE_VOLUME_MUTE -> {
                    mDvbVolumeControlUtil.setVolumeMute()
                    return true
                }
            }
        }
        return super.onKeyDown(keyCode, event)
    }
```

