/**
 * 定制化导出excel（定制化：附加标题&&样式）
 * @param { 表头 } headers
 * @param { 数据源  } datasource
 * @param { 表格副标题 } options
 * @param { 配置文件类型 } type
 * @param { 导出的文件名 } fileName
 */
function exportExcel(headers, datasource, options, type, fileName = "未命名") {

	// 处理列宽
	const cloWidth = headers.map(item => ({
		wpx: item.width || 60
	}))

	// 处理附加表头
	const _options = options.map((item, i) =>
			Object.assign({}, {
				title: item.title,
				position: String.fromCharCode(65) + (i + 1)
			})
		)
		.reduce((prev, next) =>
			Object.assign({}, prev, {
				[next.position]: {
					v: next.title
				}
			}), {},
		)

	// 处理表头
	const _headers = headers.map((item, i) =>
			Object.assign({}, {
				key: item.dataIndex,
				title: item.title,
				position: String.fromCharCode(65 + i) + (options.length + 1)
			})
		)
		.reduce((prev, next) =>
			Object.assign({}, prev, {
				[next.position]: {
					v: next.title,
					key: next.key
				}
			}), {},
		)

	// 处理数据源
	const _data = datasource.map((item, i) =>
			headers.map((col, j) =>
				Object.assign({}, {
					content: item[col.dataIndex],
					position: String.fromCharCode(65 + j) + (options.length + i + 2)
				})
			)
		)
		.reduce((prev, next) => prev.concat(next))
		.reduce((prev, next) =>
			Object.assign({}, prev, {
				[next.position]: {
					v: next.content
				}
			}), {}
		)

	const output = Object.assign({}, _options, _headers, _data);
	const outputPos = Object.keys(output); // 设置表格渲染区域,如从A1到C8

	// 设置单元格样式！！！！   仅xlsx-style生效，js-xlsx写了也不生效
	// 这里对每个单元格设置样式是写死的，每次改样式改都要改这里有点鸡肋
	output.A1.s = {
		font: {
			sz: 14,
			bold: true,
			vertAlign: true
		},
		alignment: {
			vertical: 'center',
			horizontal: 'center'
		},
		fill: {
			bgColor: {
				rgb: 'E8E8E8'
			},
			fgColor: {
				rgb: 'E8E8E8'
			}
		},
	};
	output.A2.s = {
		font: {
			sz: 11,
			bold: true,
			vertAlign: true
		},
		alignment: {
			vertical: 'center',
			horizontal: 'bottom'
		},
	};
	output.A3.s = {
		font: {
			sz: 11,
			bold: true,
			vertAlign: true
		},
		alignment: {
			vertical: 'center',
			horizontal: 'bottom'
		},
	};
	output.A4.s = {
		font: {
			sz: 11,
			bold: true,
			vertAlign: true
		},
		alignment: {
			vertical: 'center',
			horizontal: 'bottom'
		},
	};

	// 合并单元格
	const merges = options.map((item, i) => ({
		s: {
			c: 0,
			r: i
		},
		e: {
			c: headers.length - 1,
			r: i
		},
	}))

	const wb = {
		SheetNames: ['mySheet'], // 保存的表标题
		Sheets: {
			mySheet: Object.assign({},
				output, // 导出的内容
				{
					'!ref': `${outputPos[0]}:${outputPos[outputPos.length - 1]}`, // 设置填充区域（表格渲染区域）
					'!cols': [...cloWidth],
					'!merges': [...merges]
				}
			),
		},
	};

	// 这种导出方法只适用于js-xlsx，且设置的单元格样式不生效，
	// 直接打开下面这两行就行了，后面的可以省略
	// XLSX.writeFile(wb,`${fileName}.xlsx`);
	// return;

	/** 
	 * 以下这种导出方法对于js-xlsx/xlsx-style都适用
	 * 区别在于import XLSX from 'xlsx-style';可以设置单元格样式
	 * import XLSX from 'xlsx';不支持设置单元格样式
	 * 
	 * new Blob转换成二进制类型的对象
	 */
	const tmpDown = new Blob(
		[
			s2ab(
				XLSX.write(
					wb, {
						bookType: type == undefined ? 'xlsx' : type.bookType,
						bookSST: false,
						type: 'binary'
					} // 这里的数据是用来定义导出的格式类型
				)
			),
		], {
			type: '',
		}
	);
	// 数据都准备完成，可以开始下载excel了
	downExcel(tmpDown, `${fileName + '.'}${type.bookType == 'biff2' ? 'xls' : type.bookType}`);
}


/**
 * <a>标签下载excel
 * @param { Blob对象:二进制的数据 } obj
 * @param { 文件名+文件类型后缀 } fileName
 */
function downExcel(obj, fileName) {

	openDownloadDialog(obj, fileName)
	return;
	

	const a_node = document.createElement('a');
	a_node.download = fileName;

	// 兼容ie
	if ('msSaveOrOpenBlob' in navigator) {
		window.navigator.msSaveOrOpenBlob(obj, fileName);
	} else {
		// URL.createObjectURL根据传入的参数创建一个指向该参数对象的URL. 这个URL的生命仅存在于它被创建的这个文档里. 
		// 新的对象URL指向执行的File对象或者是Blob对象.
		a_node.href = URL.createObjectURL(obj);
	}
	a_node.click();

	// 每次调用createObjectURL的时候,一个新的URL对象就被创建了.即使你已经为同一个文件创建过一个URL. 
	// 如果你不再需要这个对象,要释放它,需要使用URL.revokeObjectURL()方法.
	//  当页面被关闭,浏览器会自动释放它,但是为了最佳性能和内存使用,当确保不再用得到它的时候,就应该释放它.
	setTimeout(() => {
		URL.revokeObjectURL(obj);
	}, 100);
}

/**
 * 通用的打开下载对话框方法，没有测试过具体兼容性
 * @param url 下载地址，也可以是一个blob对象，必选
 * @param saveName 保存文件名，可选
 */
function openDownloadDialog(url, saveName) {
	if (typeof url == 'object' && url instanceof Blob) {
		url = URL.createObjectURL(url); // 创建blob地址
	}
	var aLink = document.createElement('a');
	aLink.href = url;
	aLink.download = saveName || ''; // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
	var event;
	if (window.MouseEvent) event = new MouseEvent('click');
	else {
		event = document.createEvent('MouseEvents');
		event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
	}
	aLink.dispatchEvent(event);
}


// 字符串转字符流---转化为二进制的数据流
function s2ab(s) {
	if (typeof ArrayBuffer !== 'undefined') {
		const buf = new ArrayBuffer(s.length);
		const view = new Uint8Array(buf);
		for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
		return buf;
	} else {
		const buf = new Array(s.length);
		for (let i = 0; i != s.length; ++i) buf[i] = s.charCodeAt(i) & 0xff;
		return buf;
	}
}
// ————————————————
// 版权声明：本文为CSDN博主「圆圆小朋友」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
// 原文链接：https://blog.csdn.net/weixin_38649188/article/details/110440966
