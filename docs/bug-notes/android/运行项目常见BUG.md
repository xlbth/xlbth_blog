# 运行项目常见BUG

## 背景

当初次引入一些大型项目，比如`LauncherGroup`往往包含多个模块还有很多依赖。还有在一些老的项目比如`oobe`引入其他公共模块。这时候把项目跑起来运行到你的机顶盒板子里，同步编译可能会遇到各种问题。以下是一些常见问题的解决方案。

## 一、同步无法通过

### 一般原因

1. `gradle` 和`jdk` 版本与项目不匹配。
2. 缺少gradle文件
3. 缺少模块
4. 网络问题

### 解决方案

*   首先检查你的`gradle` 和`jdk` 版本，`launcher`和`tvsetting`大多数项目需要为设置6.8.3和11。

    在Project Structure查看你的gradle版本，你可能会遇到gradle版本为空且无法选择，这时候需要**检查你的项目是否包含gradle文件**，缺少该配置文件无法进行同步，可以从其他分支或项目复制导入。

    在Setting>Build, Execution, Deployment >BuildTools >Gradle查看你的sdk版本。
*   查看`settings.gradle`是否缺少对应的模块。

    `settings.gradle`中的模块的代码如果有名字和项目中的子模块名字不一样，也无法同步。比如`TvSettingGroup`中的`settings.gradle` 是`include ':tvsettings'` 但从仓库拉取的子模块文件名是`tvsetting` 。造成`tvsetting`并没有被引入，需要改成一致的命名，去掉s或添加s。
*   检查是否有网络报错，同步是导入模块和下载依赖的步骤，有些依赖需要翻墙下载。

## 二、编译无法通过

### 一般原因

1. 代码错误
2. sdk版本不匹配
3. 重复依赖

### 解决方案

*   当编译时提示缺少对应的代码或某块代码报错时，检查项目的代码是否更新到最新状态。

    切换到对应的分支查看log，拉取最新分支的代码。只是更新了主项目的代码而没有更新子模块代码，可能会引起报错。
*   代码是最新的，检查渠道是否选择正确，进行rebuild。
*   其他情况根据报错信息，可询问AI，具体分析。

### sdk版本太低

```bash
F:\Project\launchergroup\presenterlib\build\intermediates\tmp\manifest\androidTest\s905x9d\debug\manifestMerger16265559191346746757.xml:5:5-74 
Error: uses-sdk:minSdkVersion 24 cannot be smaller than version 26 declared in library [com.tosmart:settinglib-905_x9d:1.2.1]
```

解决：`config.gradle`中minSdk改成26

### 引入模块

#### `oobe`项目无法引入`ottcore`模块

![](https://s1.vika.cn/space/2024/08/28/e53025bf018f4c749ddc5728b849c10a)

`oobe`引入`ottcore` 模块时编译出现报错无法识别Build.VERSION.CODES中的常量。该bug有两种原因：

1.  项目的`targetSdkVersion` 版本低于该常量。
2.  项目的`sdk`或`gradle`配置出现问题，需要对比其他模块，修改`gradle.build`文件。通过对比发现是下面代码的问题。

    ```java
     gradle.projectsEvaluated {
            tasks.withType(JavaCompile) {
                Set<File> fileSet = options.bootstrapClasspath.getFiles()
                List<File> newFileList = new ArrayList<>()
                newFileList.add(new File("README.md/framework_aml.jar"))
                newFileList.addAll(fileSet)
                options.bootstrapClasspath = files(newFileList.toArray())
            }
        }
    ```

    这块配置修改了`JavaCompile`任务的`bootstrapClasspath`选项，而`bootstrapClasspath`通常用于指定JDK的引导类路径，指向的是用于编译Java代码的基础类路径，通常包括JDK或Android SDK中的核心类库。更改它可能会导致项目在编译时无法正确加载和解析标准的Android SDK类，包括`Build.VERSION_CODES`中的常量。

    解决：使用`-Xbootclasspath/p:`参数来添加jar，避免覆盖或移除Android SDK的核心类路径。

    ```java
    gradle.projectsEvaluated {
        tasks.withType(JavaCompile) {
            //options.compilerArgs.add('-Xbootclasspath/p:' + rootProject.rootDir + '/README/framework_aml.jar')
            options.compilerArgs.add('-Xbootclasspath/p:README\\framework_aml.jar')
        }
    }
    ```

### 重复依赖

引入项目通常会出现了重复依赖的bug、可以打开idea日志进行排查。

通过检查idea日志发现，platform.jar包和`com.tosmart.platform`里面有重复的类

原因是`ott`中存在多余的jar包`publicplatlib.jar`没有删除在模块中被引用了。而`oobe`中在依赖中也添加了`api 'com.tosmart:publicplatlib:1.1'` 。产生了重复依赖。

解决方案，删除多余的jar包，保留通过配置文件引入的`publicplatlib`。

#### 查看日志方法

通过idea的日志查看编译信息：help -> Show Log in Explorer

打开idea.log后会有对应的记录，日志是按时间顺序追加的，可以直接在里面搜索关键字，再根据错误信息找到对应的解决办法。

## 三、编译出来的apk，推到板子内无效

### 一般原因和解决方案

*   检查渠道是否正确
*   检查签名文件是否是其他板子的签名。若没有对应板子的签名，则需要从其他模块复制进来。
*   默认编译了第一个渠道，选择了下一个渠道没有重新编译，用了第一个渠道编译好的数据。需要重新`rebuild`或清理缓存`Invalidate Caches`
*   检查TV Setting中的Main Screen 有没有设置某个apk为主界面，把它卸载

## 四、应用崩溃或重启

解决方案：查看打印日志、添加打印、空指针异常需要加判空处理。
