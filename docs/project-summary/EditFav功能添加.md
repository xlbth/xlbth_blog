# EditFav功能的添加

EditFav功能已添加到EditChannel相关类当中。

旧osd：gulf已经实现。新osd：twilight与airyEthereal已经实现。

可参考以上代码提交记录。

## 实现步骤

1. 在enterChannel中传入favGourpIndex

2. 修改oklist的favlist获取的数据

   当是favlist的时候，将`mChannelHelper.getFilterProgramList(mTvType, filterItem)`改成`mChannelHelper.getFilterFavProgramList(mTvType, filterItem)`

```c
diff --git a/src/hulk/res/values/bools.xml b/src/hulk/res/values/bools.xml
index f147e1972c6b4325ee55f5b7d83634468a822240..98fa8e1cc7cbfda0104532c1152f025adbb68b0f 100644
--- a/src/hulk/res/values/bools.xml
+++ b/src/hulk/res/values/bools.xml
@@ -1,4 +1,5 @@
 <?xml version="1.0" encoding="utf-8"?>
 <resources>
     <bool name="is_blue_key_to_show_info_at_ok_list">true</bool>
+    <bool name="is_support_edit_fav_channel">true</bool>
 </resources>
\ No newline at end of file
diff --git a/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListFragment.kt b/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListFragment.kt
index a9c7b401cb0a37ecd1ad29941ceec17ee7d6f44e..831ba431a83acac26d8cfe0a30d2b3273c424ce3 100644
--- a/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListFragment.kt
+++ b/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListFragment.kt
@@ -767,8 +767,16 @@ class ChannelListFragment : BaseBindingFragment<FragmentHomeChannelListBinding>(
 
     private fun enterChannel(type: Int) {
         val tvState = DataBaseManager.getInstance(Utils.getApp()).boxInfo.tv_state
+        var favGroupIndex = DVBConstants.GROUP_ALL
         val subType: Int? = when (type) {
             Constants.TYPE_FUNCTION_CHANNEL_FAV -> {
+                val isFavList = mTypeFilter > DVBConstants.FAV_BASE && mTypeFilter < DVBConstants.FAV_MAX
+                if (SourceUtil.getBool(R.bool.is_support_edit_fav_channel) &&  isFavList) {
+                     favGroupIndex = mCurCategoryIndex + 1
+                    if (favGroupIndex == mCategoryList.size){
+                        favGroupIndex = DVBConstants.GROUP_ALL
+                    }
+                }
                 if (tvState.toInt() == DVBConstants.TV) {
                     Constants.MENU_SUB_EDIT_FAV_TV
                 } else {
@@ -792,7 +800,8 @@ class ChannelListFragment : BaseBindingFragment<FragmentHomeChannelListBinding>(
             true,
             Constants.TYPE_EDIT_CHANNEL,
             subType,
-            null
+            null,
+            favGroupIndex
         )
         mIsRefreshList = true
     }
diff --git a/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListPresenter.kt b/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListPresenter.kt
index 912a1dc94d7c747978b3c8ec48ad8b8d4d1a7215..5f381839ebd64d162d0ca114b5bf2fbd9abbd6f7 100644
--- a/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListPresenter.kt
+++ b/src/main/java/com/tosmart/ethereal/home/channellist/ChannelListPresenter.kt
@@ -30,14 +30,18 @@ import com.excellence.presenterlib.IKeyEventInterface
 import com.excellence.presenterlib.extend.IExtChannelListContract
 import com.excellence.presenterlib.home.HomeEventHelper
 import com.excellence.presenterlib.utils.NetRecordUtils
+import com.tosmart.ethereal.R
 import com.tosmart.osd.entity.SatelliteListResponse
 import com.tosmart.osd.request.RecordRequest
 import com.tulip.common.handler.WeakHandler
 import com.tulip.common.util.DEAL_RETURN
 import com.tulip.common.util.EmptyUtils
+import com.tulip.common.util.SourceUtil
 import com.tulip.common.util.Utils
 import com.util.Customize
 import com.util.DVBConstants
+import io.reactivex.disposables.CompositeDisposable
+import io.reactivex.schedulers.Schedulers
 import kotlinx.coroutines.Dispatchers
 import kotlinx.coroutines.Job
 import kotlinx.coroutines.MainScope
@@ -97,6 +101,7 @@ class ChannelListPresenter(
     private var mTvType = DVBConstants.TV
     private var mContext: Context? = null
     private var requestEpgInfoListJob: Job? = null
+    private val mCompositeDisposable = CompositeDisposable()
 
     init {
         mView.setPresenter(this)
@@ -164,6 +169,9 @@ class ChannelListPresenter(
         if (EventBus.getDefault().isRegistered(this)) {
             EventBus.getDefault().unregister(this)
         }
+        if (mCompositeDisposable.size() > 0) {
+            mCompositeDisposable.dispose();
+        }
         disConnectSignal()
         mMainScope.cancel()
     }
@@ -198,6 +206,7 @@ class ChannelListPresenter(
                     mView.showRecord(mCurrentProgram!!.id)
                     return DEAL_RETURN.DONE
                 }
+
                 DVBConstants.KEY_SAT -> {
                     if (ChmControlUtil.getChmChannelListStyle(Utils.getApp()) == 0) {
                         HomeEventHelper.post(HomeEventHelper.MSG_HIDE_CH_LIST)
@@ -210,6 +219,7 @@ class ChannelListPresenter(
                     }
                     return DEAL_RETURN.DONE
                 }
+
                 DVBConstants.KEY_F1 -> {
                     ExtEventHelper.post(ExtEventHelper.MSG_CHANNEL_LIST_EXT_KEY_EVENT, event)
                     return DEAL_RETURN.DONE
@@ -338,7 +348,7 @@ class ChannelListPresenter(
     /**
      * 处理，主播放界面点击OK唤出ChannelList的情况
      * 输入参数type为DVBConstants.GROUP_ALL或者DVBConstants.FAV_BASE
-     * 
+     *
      * 点击OK时，有可能之前存在已保存的过滤类别，比如之前进行过HD的过滤
      */
     private fun dealOkListLogic(type: Int) {
@@ -516,35 +526,70 @@ class ChannelListPresenter(
 
     @Synchronized
     private fun loadProgramList(filterItem: GroupFilterItem?) {
-        Log.d(TAG, "loadProgramList() called with: filterItem = $filterItem")
         if (filterItem == null) {
             return
         }
-        mMainScope.launch(Dispatchers.IO) {
-            val programInfoDataList = ArrayList<ProgramInfoData>()
-            val dataList = mChannelHelper.getFilterProgramList(mTvType, filterItem)
-                .stream()
-                .filter { programInfo: ProgramInfo -> programInfo.hide == DVBConstants.SHOW.toShort() }
-                .collect(Collectors.toList())
-                .mapIndexed { index, programInfo ->
-                    ChannelCache.toProgramInfoData(
-                        index,
-                        programInfo
-                    )
+        if (SourceUtil.getBool(R.bool.is_support_edit_fav_channel)
+            && filterItem.typeFilter > DVBConstants.FAV_BASE && filterItem.typeFilter < DVBConstants.FAV_MAX) {
+            val observable = mChannelHelper.getFilterFavProgramList(mTvType, filterItem)
+                .subscribeOn(Schedulers.io())
+                .subscribe(
+                    { favProgramInfo ->
+                        val programInfoDataList = ArrayList<ProgramInfoData>()
+                        val dataList = favProgramInfo
+                            .stream()
+                            .filter { programInfo: ProgramInfo -> programInfo.hide == DVBConstants.SHOW.toShort() }
+                            .collect(Collectors.toList())
+                            .mapIndexed { index, programInfo ->
+                                ChannelCache.toProgramInfoData(
+                                    index,
+                                    programInfo
+                                )
+                            }
+                            .map { infoData ->
+                                programInfoDataList.add(infoData)
+                                ProgramInfoShowData(infoData)
+                            }
+                            .toMutableList()
+                        mProgramDataList = programInfoDataList
+                        mMainScope.launch(Dispatchers.Main) {
+                            mView.setNeedLoadProgramInfo(true)
+                            mProgramShowDataList.clear()
+                            updateProgramList(dataList)
+                        }
+                    },
+                    { throwable ->
+                        Log.e(TAG, "loadFavProgramInfoDataListAsync error", throwable)
+                    }
+                )
+            mCompositeDisposable.add(observable)
+        } else {
+            mMainScope.launch(Dispatchers.IO) {
+                val programInfoDataList = ArrayList<ProgramInfoData>()
+                val dataList = mChannelHelper.getFilterProgramList(mTvType, filterItem)
+                    .stream()
+                    .filter { programInfo: ProgramInfo -> programInfo.hide == DVBConstants.SHOW.toShort() }
+                    .collect(Collectors.toList())
+                    .mapIndexed { index, programInfo ->
+                        ChannelCache.toProgramInfoData(
+                            index,
+                            programInfo
+                        )
+                    }
+                    .map { infoData ->
+                        programInfoDataList.add(infoData)
+                        ProgramInfoShowData(infoData)
+                    }
+                    .toMutableList()
+                mProgramDataList = programInfoDataList
+                if (EmptyUtils.isEmpty(mProgramDataList)) {
+                    mProgramDataList = ArrayList<ProgramInfoData>()
                 }
-                .map { infoData ->
-                    programInfoDataList.add(infoData)
-                    ProgramInfoShowData(infoData)
+                withContext(Dispatchers.Main) {
+                    mView.setNeedLoadProgramInfo(true)
+                    mProgramShowDataList.clear()
+                    updateProgramList(dataList)
                 }
-                .toMutableList()
-            mProgramDataList = programInfoDataList
-            if (EmptyUtils.isEmpty(mProgramDataList)) {
-                mProgramDataList = ArrayList<ProgramInfoData>()
-            }
-            withContext(Dispatchers.Main) {
-                mView.setNeedLoadProgramInfo(true)
-                mProgramShowDataList.clear()
-                updateProgramList(dataList)
             }
         }
     }
diff --git a/src/main/res/values/bools.xml b/src/main/res/values/bools.xml
index d130e761c3ce7ffee3736394d55b49556e4a905c..bc9ba096e38b47b5b500c53f4845f39f2b52afb4 100644
--- a/src/main/res/values/bools.xml
+++ b/src/main/res/values/bools.xml
@@ -1,6 +1,5 @@
 <?xml version="1.0" encoding="utf-8"?>
 <resources>
-
     <bool name="edit_channel_fav_is_loop_scroll">true</bool>
     <bool name="user_channel_list_item_scale_enable">true</bool>
     <bool name="channel_list_item_playing_flag_cover">true</bool>
@@ -8,4 +7,5 @@
     <bool name="is_switch_direction_key_and_pg_key">false</bool>
     <bool name="is_blue_key_to_show_info_at_ok_list">false</bool>
     <bool name="is_support_main_interface_play">false</bool>
+    <bool name="is_support_edit_fav_channel">false</bool>
 </resources>
\ No newline at end of file

```

## 关键点

1. FavGroupIndex要传正确
2. FavList的列表要是单独排序的，editFav可编辑顺序，需要和editChannel的编辑顺序区分开